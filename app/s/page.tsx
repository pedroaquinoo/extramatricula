"use client"

import { useEffect, useMemo, useState } from "react"
import { SharedWeeklyPlanner } from "@/components/extra/shared-weekly-planner"
import { LoadingScreen } from "@/components/extra/loading-screen"
import { decodeSharePayload, resolveShareCourseId } from "@/lib/share"
import { findTurma, getCurrentOfferTerm } from "@/lib/offers"
import type { PlannedClass } from "@/hooks/use-weekly-planner"

export default function SharedSchedulePage() {
  const [hash, setHash] = useState("")
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setHash(window.location.hash)
    setReady(true)
  }, [])

  const decoded = useMemo(() => decodeSharePayload(hash), [hash])

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

  if (decoded.term !== getCurrentOfferTerm()) {
    return (
      <div className="min-h-screen p-8">
        <h1 className="text-2xl font-bold mb-2">Semestre passado</h1>
        <p className="text-muted-foreground">
          Esta grade é de um semestre passado ({decoded.term}). A oferta atual é{" "}
          {getCurrentOfferTerm()}.
        </p>
      </div>
    )
  }

  const programId = resolveShareCourseId(decoded)

  const plannedClasses: PlannedClass[] = decoded.picks
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
