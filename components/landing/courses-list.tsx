"use client"

import { useState } from "react"
import { Check, ChevronDown } from "lucide-react"
import type { CourseGroup } from "@/lib/curriculum"
import { formatShiftLabel } from "@/lib/shift"

const INITIAL_COUNT = 4

export default function CoursesList({ courses }: { courses: CourseGroup[] }) {
  const [expanded, setExpanded] = useState(false)

  const sorted = [...courses].sort((a, b) =>
    a.name.localeCompare(b.name, "pt-BR"),
  )
  const visible = expanded ? sorted : sorted.slice(0, INITIAL_COUNT)
  const hidden = sorted.length - INITIAL_COUNT

  return (
    <>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {visible.map((course) => (
          <li
            key={course.offerId}
            className="flex items-center gap-3 rounded-xl border bg-card p-4"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-balance">{course.name}</p>
              <p className="text-xs text-muted-foreground">
                {course.shifts.map(formatShiftLabel).join(" · ")}
              </p>
            </div>
            <Check className="ml-auto size-4 shrink-0 text-primary" />
          </li>
        ))}
      </ul>

      {hidden > 0 && (
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="inline-flex items-center gap-1.5 rounded-full border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
          >
            {expanded ? "Mostrar menos" : `Mostrar mais ${hidden}`}
            <ChevronDown
              className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      )}
    </>
  )
}
