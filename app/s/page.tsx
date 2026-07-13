"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { SharedWeeklyPlanner } from "@/components/extra/shared-weekly-planner"
import { LoadingScreen } from "@/components/extra/loading-screen"
import { captureEvent } from "@/lib/analytics"
import { AnalyticsEvents } from "@/lib/analytics-events"
import { decodeSharePayload, resolveShareCourseId } from "@/lib/share"
import { findTurma, getCurrentOfferTerm } from "@/lib/offers"
import type { PlannedClass } from "@/hooks/use-weekly-planner"

export default function SharedSchedulePage() {
  const [hash, setHash] = useState("")
  const [ready, setReady] = useState(false)
  const tracked = useRef(false)

  useEffect(() => {
    setHash(window.location.hash)
    setReady(true)
  }, [])

  const decoded = useMemo(() => decodeSharePayload(hash), [hash])
  const currentTerm = getCurrentOfferTerm()

  const plannedClasses: PlannedClass[] = useMemo(() => {
    if (!decoded || decoded.term !== currentTerm) return []
    const programId = resolveShareCourseId(decoded)
    return decoded.picks
      .map((pick) => {
        const turma = findTurma(
          decoded.term,
          programId,
          pick.course_id,
          pick.availabilityCode,
        )
        if (!turma) return null
        return {
          ...turma,
          id: `${turma.course_id}-${turma.availabilityCode}`,
        }
      })
      .filter((cls): cls is PlannedClass => cls !== null)
  }, [decoded, currentTerm])

  useEffect(() => {
    if (!ready || !decoded || decoded.term !== currentTerm || tracked.current) return
    tracked.current = true
    captureEvent(AnalyticsEvents.SHARED_SCHEDULE_VIEWED, {
      planned_count: plannedClasses.length,
    })
  }, [ready, decoded, currentTerm, plannedClasses.length])

  if (!ready) {
    return <LoadingScreen className="min-h-screen" />
  }

  if (!decoded) {
    return (
      <div className="min-h-screen p-8">
        <h1 className="text-2xl font-bold mb-2">Link inválido</h1>
        <p className="text-muted-foreground">
          Não foi possível ler a grade compartilhada neste link.
        </p>
      </div>
    )
  }

  if (decoded.term !== currentTerm) {
    return (
      <div className="min-h-screen p-8">
        <h1 className="text-2xl font-bold mb-2">Semestre passado</h1>
        <p className="text-muted-foreground">
          Esta grade é de um semestre passado ({decoded.term}). A oferta atual é{" "}
          {currentTerm}.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Grade compartilhada</h1>
          <p className="text-muted-foreground">
            {decoded.semester
              ? `${decoded.semester}° semestre`
              : "Semestre não informado"}{" "}
            • Oferta {decoded.term}
          </p>
        </div>

        <div className="w-full max-w-6xl mx-auto overflow-x-auto overflow-y-hidden">
          <SharedWeeklyPlanner
            plannedClasses={plannedClasses}
            semester={decoded.semester ?? 0}
          />
        </div>
      </div>
    </div>
  )
}
