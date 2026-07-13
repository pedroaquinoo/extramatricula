"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Check } from "lucide-react"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { CourseChip } from "@/components/extra/course-chip"
import { SetupPrompt } from "@/components/extra/setup-dialog"
import { LoadingScreen } from "@/components/extra/loading-screen"
import { useCourseData } from "@/hooks/use-course-data"
import { useAppStore } from "@/lib/store"
import type { ClassWithPrerequisites } from "@/lib/types/curriculum"

interface SemesterGroup {
  semester: number
  classes: ClassWithPrerequisites[]
  codes: string[]
  passedCount: number
  credits: number
  complete: boolean
}

export default function CoursePage() {
  const { courseId, classes, passedSet, hasData } = useCourseData()
  const { togglePassed, setManyPassed } = useAppStore()

  const [open, setOpen] = useState<string[]>([])
  const openInitialized = useRef(false)

  const groups = useMemo<SemesterGroup[]>(() => {
    const bySemester = new Map<number, ClassWithPrerequisites[]>()
    for (const cls of classes) {
      if (!bySemester.has(cls.ref_period)) bySemester.set(cls.ref_period, [])
      bySemester.get(cls.ref_period)!.push(cls)
    }
    return Array.from(bySemester.entries())
      .sort(([a], [b]) => a - b)
      .map(([semester, semesterClasses]) => {
        const codes = semesterClasses.map((cls) => cls.code)
        const passedCount = codes.filter((code) => passedSet.has(code)).length
        return {
          semester,
          classes: semesterClasses,
          codes,
          passedCount,
          credits: semesterClasses.reduce((sum, cls) => sum + cls.credits, 0),
          complete: passedCount === codes.length,
        }
      })
  }, [classes, passedSet])

  const { passedCount, totalCredits, passedCredits } = useMemo(() => {
    const passedClasses = classes.filter((cls) => passedSet.has(cls.code))
    return {
      passedCount: passedClasses.length,
      totalCredits: classes.reduce((sum, cls) => sum + cls.credits, 0),
      passedCredits: passedClasses.reduce((sum, cls) => sum + cls.credits, 0),
    }
  }, [classes, passedSet])

  // Open where the user actually is, the first unfinished semester, but only once
  // the store has hydrated, and never again after, so toggling never reshuffles panels.
  useEffect(() => {
    if (openInitialized.current || groups.length === 0) return
    openInitialized.current = true
    const firstIncomplete = groups.find((group) => !group.complete) ?? groups[0]
    setOpen([String(firstIncomplete.semester)])
  }, [groups])

  if (!courseId) {
    return <SetupPrompt />
  }

  if (!hasData) {
    return <LoadingScreen />
  }

  const progress = totalCredits > 0 ? (passedCredits / totalCredits) * 100 : 0

  return (
    <div className="mx-auto w-full max-w-3xl pb-10">
      <header className="sticky top-0 z-10 border-b bg-background/90 px-4 py-3 backdrop-blur sm:px-6">
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="font-semibold">Grade curricular</h1>
          <p className="text-sm tabular-nums text-muted-foreground">
            {passedCount}/{classes.length} disciplinas
          </p>
        </div>
        <Progress value={progress} className="mt-2 h-1.5" />
        <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
          <CourseChip className="min-w-0" />
          <span className="shrink-0 tabular-nums">
            · {passedCredits}/{totalCredits} créditos
          </span>
        </div>
      </header>

      <div className="flex flex-col gap-4 px-4 pt-4 sm:px-6">
        <Accordion type="multiple" value={open} onValueChange={setOpen}>
          {groups.map((group) => (
            <AccordionItem
              key={group.semester}
              value={String(group.semester)}
              className="border-b last:border-b-0"
            >
              <AccordionTrigger className="gap-3 py-3 hover:no-underline">
                <div className="flex flex-1 items-center gap-3">
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-medium tabular-nums transition-colors",
                      group.complete
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {group.complete ? <Check className="size-4" /> : group.semester}
                  </span>

                  <span className="flex min-w-0 flex-col text-left">
                    <span className="text-sm font-medium">{group.semester}° período</span>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {group.passedCount}/{group.classes.length} · {group.credits}{" "}
                      créditos · {group.credits * 15} horas
                    </span>
                  </span>
                </div>
              </AccordionTrigger>

              <AccordionContent className="pb-3">
                <button
                  type="button"
                  onClick={() => setManyPassed(group.codes, !group.complete)}
                  className="mb-2 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-transform duration-150 ease-out active:scale-[0.97] hover:text-foreground"
                >
                  {group.complete ? "Desmarcar todas" : "Marcar todas"}
                </button>

                <ul className="overflow-hidden rounded-xl border">
                  {group.classes.map((cls) => {
                    const isPassed = passedSet.has(cls.code)
                    return (
                      <li key={cls.code} className="border-b last:border-b-0">
                        <label
                          className={cn(
                            "flex cursor-pointer items-center gap-3 px-3 py-3 transition-[transform,background-color] duration-150 ease-out active:scale-[0.99]",
                            isPassed ? "bg-primary/[0.04]" : "hover:bg-muted/50",
                          )}
                        >
                          <Checkbox
                            checked={isPassed}
                            onCheckedChange={() => togglePassed(cls.code)}
                            className="size-5 shrink-0"
                          />

                          <span className="flex min-w-0 flex-1 flex-col">
                            <span
                              className={cn(
                                "truncate text-sm transition-colors",
                                isPassed && "text-muted-foreground line-through",
                              )}
                            >
                              {cls.name}
                            </span>
                            <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                              <span className="font-mono">{cls.code}</span>
                              <span aria-hidden>·</span>
                              <span className="tabular-nums">{cls.credits} créditos</span>
                              <span aria-hidden>·</span>
                              <span className="tabular-nums">
                                {cls.credits * 15} horas
                              </span>
                              {cls.elective && (
                                <span className="rounded-full border px-1.5 leading-4">
                                  optativa
                                </span>
                              )}
                            </span>
                          </span>
                        </label>
                      </li>
                    )
                  })}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <p className="text-center text-xs text-muted-foreground">
          Tudo o que você marca fica salvo apenas neste navegador.
        </p>
      </div>
    </div>
  )
}
