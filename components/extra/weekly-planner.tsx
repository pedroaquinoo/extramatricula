"use client"

import { Button } from "@/components/ui/button"
import { CalendarDays } from "lucide-react"
import { PlannedClass } from "@/hooks/use-weekly-planner"
import { getCreditsByCode } from "@/lib/curriculum"
import WeeklyCalendar from "./weekly-calendar"

const HOURS_PER_CREDIT = 15

interface WeeklyPlannerProps {
  plannedClasses: PlannedClass[]
  onRemoveClass: (classId: string) => void
  onClearPlanner: () => void
}

export function WeeklyPlanner({
  plannedClasses,
  onRemoveClass,
  onClearPlanner,
}: WeeklyPlannerProps) {
  // A course can appear as two sections (lecture + lab), so credits are counted once
  // per unique discipline. Each credit maps to 15h of class time in the semester.
  const totalHours =
    Array.from(new Set(plannedClasses.map((cls) => cls.course_id))).reduce(
      (sum, code) => sum + getCreditsByCode(code),
      0,
    ) * HOURS_PER_CREDIT

  return (
    <div className="flex w-full min-w-0 flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium">
          Minha semana
          {plannedClasses.length > 0 && (
            <span className="ml-1.5 tabular-nums text-muted-foreground">
              · {plannedClasses.length}{" "}
              {plannedClasses.length === 1 ? "disciplina" : "disciplinas"}
              {totalHours > 0 && <> · {totalHours}h no semestre</>}
            </span>
          )}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearPlanner}
          disabled={plannedClasses.length === 0}
        >
          Limpar
        </Button>
      </div>

      {plannedClasses.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-12 text-center">
          <CalendarDays className="size-8 text-muted-foreground" />
          <p className="text-sm font-medium">Nenhuma turma escolhida</p>
          <p className="text-xs text-pretty text-muted-foreground">
            Toque numa turma da lista para vê-la aparecer na sua semana.
          </p>
        </div>
      ) : (
        <WeeklyCalendar classes={plannedClasses} onRemoveClass={onRemoveClass} />
      )}
    </div>
  )
}
