"use client"

import { ChevronsUpDown } from "lucide-react"

import { openSetup } from "@/components/extra/setup-dialog"
import { useCourseData } from "@/hooks/use-course-data"
import { formatCourseDisplay } from "@/lib/curriculum"
import { useAppStore } from "@/lib/store"
import { cn } from "@/lib/utils"

/**
 * The course/period is set once in the onboarding, so the only affordance to change it is
 * the line that already states it, inside the page, not in the nav.
 */
export function CourseChip({ className }: { className?: string }) {
  const { course } = useCourseData()
  const { semester } = useAppStore()

  if (!course) return null

  return (
    <button
      type="button"
      onClick={openSetup}
      className={cn(
        "flex min-w-0 items-center gap-1.5 rounded-md py-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground",
        className,
      )}
    >
      <span className="truncate">{formatCourseDisplay(course)}</span>
      {semester && <span className="shrink-0 tabular-nums">· {semester}° período</span>}
      <ChevronsUpDown className="size-3 shrink-0" />
    </button>
  )
}
