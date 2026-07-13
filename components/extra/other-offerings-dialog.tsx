"use client"

import { useMemo, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, User, Check, Globe, TriangleAlert } from "lucide-react"
import { findTurmasAcrossOffers, getCurrentOfferTerm } from "@/lib/offers"
import { getCourseGroups } from "@/lib/curriculum"
import { isOffShift, type Shift } from "@/lib/shift"
import { OffShiftBadge } from "@/components/extra/off-shift-badge"
import { captureEvent } from "@/lib/analytics"
import { AnalyticsEvents } from "@/lib/analytics-events"
import type { AvailableClass } from "@/hooks/use-available-classes"

interface OtherOfferingsDialogProps {
  disciplineCode: string
  disciplineName: string
  // Availability codes already listed in the student's own program offer, so we only
  // surface the turmas they can't already see.
  ownCodes: Set<string>
  selectedClasses: AvailableClass[]
  onSelectClass: (cls: AvailableClass) => void
  shift: Shift | null
}

const offerNameById = new Map(
  getCourseGroups().map((group) => [group.offerId, group.name]),
)

export function OtherOfferingsDialog({
  disciplineCode,
  disciplineName,
  ownCodes,
  selectedClasses,
  onSelectClass,
  shift,
}: OtherOfferingsDialogProps) {
  const [open, setOpen] = useState(false)
  const term = getCurrentOfferTerm()

  const otherTurmas = useMemo(
    () =>
      findTurmasAcrossOffers(term, disciplineCode).filter(
        (turma) => !ownCodes.has(turma.availabilityCode),
      ),
    [term, disciplineCode, ownCodes],
  )

  if (otherTurmas.length === 0) return null

  const isSelected = (cls: AvailableClass) =>
    selectedClasses.some(
      (selected) =>
        selected.course_id === cls.course_id &&
        selected.availabilityCode === cls.availabilityCode,
    )

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) {
      captureEvent(AnalyticsEvents.OTHER_TURMAS_VIEWED, {
        course_code: disciplineCode,
        turma_count: otherTurmas.length,
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1.5 px-2 text-xs">
          <Globe className="size-3.5" />
          Outras turmas
          <Badge variant="secondary" className="ml-0.5 px-1.5 tabular-nums">
            {otherTurmas.length}
          </Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85svh] gap-3 overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <span className="font-mono">{disciplineCode}</span>
            <span className="font-normal text-muted-foreground">·</span>
            <span className="truncate font-normal">{disciplineName}</span>
          </DialogTitle>
          <DialogDescription>
            Turmas desta disciplina ofertadas em outros cursos.
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive">
          <TriangleAlert />
          <AlertDescription>
            Não aparecem na sua matrícula, só entram via acerto de matrícula, pedindo ao
            Colegiado.
          </AlertDescription>
        </Alert>

        <div className="flex flex-col gap-2">
          {otherTurmas.map((turma) => {
            const selected = isSelected(turma)
            const offShift = isOffShift(shift, turma.times)
            const programs = turma.offerIds
              .map((id) => offerNameById.get(id) ?? id)
              .join(", ")
            return (
              <button
                key={turma.availabilityCode}
                type="button"
                onClick={() => onSelectClass(turma)}
                className={`flex w-full flex-col gap-1 rounded-lg border p-3 text-left transition-colors ${
                  selected
                    ? "border-primary bg-primary/10"
                    : "bg-background hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {turma.availabilityCode.startsWith("P") && (
                      <Badge variant="outline" className="text-xs text-primary">
                        PRÁTICA
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {turma.availabilityCode}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {turma.spots} vagas
                    </span>
                  </div>
                  {selected && <Check className="size-4 shrink-0 text-primary" />}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="size-3 shrink-0" />
                  <span className="text-xs">
                    {turma.times
                      .map((t) => `${t.day.slice(0, 3)} ${t.start}-${t.end}`)
                      .join(", ")}
                  </span>
                </div>
                <div className="flex items-center gap-2 truncate text-xs">
                  <User className="size-3 shrink-0" />
                  <span className="truncate">{turma.teachers.join(", ")}</span>
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  Ofertada em: {programs}
                </p>
                {offShift && <OffShiftBadge className="mt-1" />}
              </button>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
