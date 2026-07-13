"use client"

import { CalendarDays } from "lucide-react"
import { PlannedClass } from "@/hooks/use-weekly-planner"
import WeeklyCalendar from "./weekly-calendar"

interface SharedWeeklyPlannerProps {
  plannedClasses: PlannedClass[]
  semester: number
}

export function SharedWeeklyPlanner({
  plannedClasses,
  semester,
}: SharedWeeklyPlannerProps) {
  return (
    <div className="w-2xl h-full">
      <div className="flex justify-between items-center pb-2">
        <h3 className="text-lg font-semibold">Grade Semanal - {semester}° Semestre</h3>
      </div>
      {plannedClasses.length === 0 ? (
        <div className="py-12">
          <div className="text-center text-muted-foreground">
            <div className="text-4xl mb-4 mx-auto w-fit">
              <CalendarDays className="text-primary" size={48} />
            </div>
            <p className="text-sm">Nenhuma disciplina selecionada</p>
          </div>
        </div>
      ) : (
        <WeeklyCalendar classes={plannedClasses} />
      )}
    </div>
  )
}
