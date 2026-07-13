"use client"

import { useMemo, useCallback, useState } from "react"
import { cn } from "@/lib/utils"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ArrowLeft, BookOpen, ChevronDown, Sparkles } from "lucide-react"

import { useCourseData } from "@/hooks/use-course-data"
import { useAvailableClasses } from "@/hooks/use-available-classes"
import { useWeeklyPlanner } from "@/hooks/use-weekly-planner"
import { AvailableClassList } from "@/components/extra/available-class-list"
import { WeeklyPlanner } from "@/components/extra/weekly-planner"
import { ShareSimulationButton } from "@/components/extra/share-simulation-button"
import { MagicModePanel } from "@/components/extra/magic-mode-panel"
import { ClassSearch } from "@/components/extra/class-search"
import { CourseChip } from "@/components/extra/course-chip"
import { SetupPrompt } from "@/components/extra/setup-dialog"
import { SubmissionWarning } from "@/components/extra/submission-warning"
import { LoadingScreen } from "@/components/extra/loading-screen"
import { AvailableClass } from "@/hooks/use-available-classes"
import { useAppStore } from "@/lib/store"
import { captureEvent } from "@/lib/analytics"
import { AnalyticsEvents } from "@/lib/analytics-events"
import { findTurmasAcrossOffers, getCurrentOfferTerm } from "@/lib/offers"
import type { MagicSchedule } from "@/lib/magic-mode"

type Pane = "classes" | "schedule"
type LeftView = "classes" | "magic"

export default function SimulationPage() {
  const { classes, hasData, courseId, passedSet } = useCourseData()
  const { semester } = useAppStore()
  const planner = useWeeklyPlanner()

  // On a phone there is no room for the class list and the week side by side, so they
  // become two panes; from lg up both are visible and this state is inert.
  const [pane, setPane] = useState<Pane>("classes")
  const [leftView, setLeftView] = useState<LeftView>("classes")
  const [ignorePrereqs, setIgnorePrereqs] = useState(false)

  const programClassesByPeriod = useMemo(() => {
    if (!classes || !semester) return []

    const filtered = classes.filter(
      (cls) =>
        cls.ref_period === semester ||
        (cls.ref_period < semester && !passedSet.has(cls.code)),
    )

    const grouped = new Map<number, string[]>()
    for (const cls of filtered) {
      const codes = grouped.get(cls.ref_period) ?? []
      codes.push(cls.code)
      grouped.set(cls.ref_period, codes)
    }

    return Array.from(grouped.entries())
      .sort(([a], [b]) => a - b)
      .map(([period, codes]) => ({ period, codes }))
  }, [classes, semester, passedSet])

  const hasEarlierRemaining = useMemo(() => {
    if (!classes || !semester) return false
    return classes.some((cls) => cls.ref_period < semester && !passedSet.has(cls.code))
  }, [classes, semester, passedSet])

  const userProgramCodes = useMemo(() => {
    if (!classes) return new Set<string>()
    return new Set(classes.map((cls) => cls.code))
  }, [classes])

  const { availableClasses, loading, error } = useAvailableClasses()

  const { semesterClasses, optionalCourses } = useMemo(() => {
    if (!availableClasses) {
      return { semesterClasses: [], optionalCourses: [] }
    }

    const targetCodes = programClassesByPeriod.flatMap((group) => group.codes)

    const semesterClasses = availableClasses.filter((cls) =>
      targetCodes.includes(cls.course_id),
    )

    const optionalCourses = availableClasses.filter(
      (cls) => !userProgramCodes.has(cls.course_id),
    )

    return { semesterClasses, optionalCourses }
  }, [availableClasses, programClassesByPeriod, userProgramCodes])

  const semesterClassesByPeriod = useMemo(() => {
    if (!availableClasses) return []

    return programClassesByPeriod
      .map(({ period, codes }) => ({
        period,
        classes: availableClasses.filter((cls) => codes.includes(cls.course_id)),
      }))
      .filter((group) => group.classes.length > 0)
  }, [availableClasses, programClassesByPeriod])

  const useGroupedView = semesterClassesByPeriod.length > 1

  const groupedOptional = useMemo(() => {
    const grouped: Record<string, typeof optionalCourses> = {}
    optionalCourses.forEach((course) => {
      if (!grouped[course.course_id]) {
        grouped[course.course_id] = []
      }
      grouped[course.course_id].push(course)
    })
    return grouped
  }, [optionalCourses])

  // SIGA refuses requests that mix disciplines from 3 consecutive periods, so we only
  // surface the warning once the planned turmas actually hit that pattern.
  const hasThreeConsecutivePeriods = useMemo(() => {
    if (!classes) return false
    const periodByCode = new Map(classes.map((cls) => [cls.code, cls.ref_period]))
    const periods = new Set<number>()
    for (const cls of planner.state.plannedClasses) {
      const period = periodByCode.get(cls.course_id)
      if (period !== undefined) periods.add(period)
    }
    return [...periods].some(
      (period) => periods.has(period + 1) && periods.has(period + 2),
    )
  }, [classes, planner.state.plannedClasses])

  const handleClassSelect = useCallback(
    (classData: AvailableClass, source: "list" | "search" = "list") => {
      const isOptional = !userProgramCodes.has(classData.course_id)
      if (planner.isClassSelected(classData)) {
        captureEvent(AnalyticsEvents.CLASS_REMOVED, {
          course_code: classData.course_id,
          source,
        })
        const classToRemove = planner.state.plannedClasses.find(
          (cls) =>
            cls.course_id === classData.course_id &&
            cls.availabilityCode === classData.availabilityCode,
        )
        if (classToRemove) {
          planner.removeClass(classToRemove.id)
        }
      } else {
        captureEvent(AnalyticsEvents.CLASS_ADDED, {
          course_code: classData.course_id,
          is_optional: isOptional,
          source,
        })
        planner.addClass(classData)
      }
    },
    [planner, userProgramCodes],
  )

  // Load a magic-mode result straight into the weekly planner. Picks come from this program's
  // offer, but fall back to a cross-offer lookup for turmas that live in another course's offer.
  const applySchedule = useCallback(
    (schedule: MagicSchedule) => {
      const resolved = schedule.picks
        .map(
          (pick) =>
            availableClasses.find(
              (cls) =>
                cls.course_id === pick.course_id &&
                cls.availabilityCode === pick.availabilityCode,
            ) ??
            findTurmasAcrossOffers(getCurrentOfferTerm(), pick.course_id).find(
              (t) => t.availabilityCode === pick.availabilityCode,
            ) ??
            null,
        )
        .filter((cls): cls is AvailableClass => cls !== null)
      planner.setPlan(resolved)
      // On phones the planner is a separate tab — surface the loaded grade right away.
      setPane("schedule")
    },
    [availableClasses, planner],
  )

  const handleClassRemove = useCallback(
    (classId: string) => {
      const classData = planner.state.plannedClasses.find((cls) => cls.id === classId)
      if (classData) {
        captureEvent(AnalyticsEvents.CLASS_REMOVED, {
          course_code: classData.course_id,
          source: "schedule",
        })
      }
      planner.removeClass(classId)
    },
    [planner],
  )

  if (!courseId || !semester) {
    return <SetupPrompt />
  }

  if (!hasData || !classes) {
    return <LoadingScreen className="p-4" />
  }

  const plannedCount = planner.state.plannedClasses.length

  return (
    <Tabs
      value={pane}
      onValueChange={(value) => setPane(value as Pane)}
      className="mx-auto flex w-full max-w-7xl flex-col gap-0"
    >
      <header className="sticky top-0 z-20 border-b bg-background/90 px-4 py-3 backdrop-blur sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="font-semibold">Simulação de grade</h1>
            <CourseChip className="mt-0.5" />
          </div>
          <div className="bg-secondary p-2 sm:p-0 rounded-md sm:bg-transparent grid grid-cols-2 sm:flex sm:flex-row shrink-0 sm:items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setLeftView((prev) => {
                  const next = prev === "magic" ? "classes" : "magic"
                  if (next === "magic") {
                    captureEvent(AnalyticsEvents.MAGIC_MODE_OPENED, {
                      source: "simulation_header",
                    })
                  }
                  return next
                })
              }
              aria-pressed={leftView === "magic"}
              className={cn("gap-2 col-span-1", leftView === "magic" ? "text-inherit" : "text-primary hover:text-primary/80")}
            >
              {leftView === "magic" ? <ArrowLeft className="size-4 shrink-0" /> : <Sparkles className="size-4 shrink-0" />}
              <span className="whitespace-nowrap">{leftView === "magic" ? "Voltar ao modo normal" : "Modo mágico"}</span>
            </Button> 
            <Tooltip>
              <TooltipTrigger asChild>
                <label
                  className={cn(
                    "flex h-8 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm transition-colors col-span-1",
                    ignorePrereqs
                      ? "border-primary bg-primary/[0.06]"
                      : "bg-muted/30 hover:bg-muted/50",
                  )}
                >
                  <Checkbox
                    checked={ignorePrereqs}
                    onCheckedChange={(checked) => {
                      const next = checked === true
                      setIgnorePrereqs(next)
                      captureEvent(AnalyticsEvents.PREREQS_IGNORED, { enabled: next })
                    }}
                    className="size-4 shrink-0"
                  />
                  <span className="font-medium whitespace-nowrap">
                    Ignorar pré-requisitos
                  </span>
                </label>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                Por padrão, disciplinas com pré-requisitos pendentes ficam bloqueadas.
                Ative para poder adicioná-las mesmo assim.
              </TooltipContent>
            </Tooltip>
            <SubmissionWarning hasWarnings={hasThreeConsecutivePeriods} />
            <ShareSimulationButton simulationState={planner.state} semester={semester} />
          </div>
        </div>

        <TabsList className="mt-3 grid w-full grid-cols-2 lg:hidden">
          <TabsTrigger value="classes">Turmas</TabsTrigger>
          <TabsTrigger value="schedule">
            {plannedCount ? `Minha semana (${plannedCount})` : "Minha semana"}
          </TabsTrigger>
        </TabsList>
      </header>

      <div className="flex flex-col gap-6 px-4 py-4 sm:px-6 lg:flex-row lg:items-start">
        <TabsContent
          value="classes"
          forceMount
          className="mt-0 w-full flex-col gap-4 data-[state=active]:flex data-[state=inactive]:hidden lg:w-2/5 lg:shrink-0 lg:flex-none lg:data-[state=inactive]:flex"
        >
          {leftView === "magic" ? (
            <MagicModePanel onApply={applySchedule} />
          ) : (
            <>
              <ClassSearch
                onSelectClass={(classData) => handleClassSelect(classData, "search")}
                selectedClasses={planner.state.plannedClasses}
                ignorePrereqs={ignorePrereqs}
              />

              <div className="flex w-full flex-col gap-4">
                <div className="flex flex-col gap-3">
                  <h2 className="text-sm font-medium">
                    {hasEarlierRemaining
                      ? `Obrigatórias do ${semester}° período e pendentes`
                      : `Obrigatórias do ${semester}° período`}
                  </h2>

                  {useGroupedView ? (
                    semesterClassesByPeriod.length > 0 ? (
                      <div className="flex flex-col gap-4">
                        {semesterClassesByPeriod.map(
                          ({ period, classes: periodClasses }) => (
                            <div key={period} className="flex flex-col gap-2">
                              <h3 className="text-xs font-medium text-muted-foreground">
                                {period}° período
                              </h3>
                              <AvailableClassList
                                availableClasses={periodClasses}
                                loading={loading}
                                error={error}
                                selectedClasses={planner.state.plannedClasses}
                                onSelectClass={handleClassSelect}
                                title=""
                                isCourseSelected={planner.isCourseSelected}
                                ignorePrereqs={ignorePrereqs}
                              />
                            </div>
                          ),
                        )}
                      </div>
                    ) : (
                      <AvailableClassList
                        availableClasses={[]}
                        loading={loading}
                        error={error}
                        selectedClasses={planner.state.plannedClasses}
                        onSelectClass={handleClassSelect}
                        title=""
                        isCourseSelected={planner.isCourseSelected}
                        ignorePrereqs={ignorePrereqs}
                      />
                    )
                  ) : (
                    <AvailableClassList
                      availableClasses={semesterClasses}
                      loading={loading}
                      error={error}
                      selectedClasses={planner.state.plannedClasses}
                      onSelectClass={handleClassSelect}
                      title=""
                      isCourseSelected={planner.isCourseSelected}
                      ignorePrereqs={ignorePrereqs}
                    />
                  )}
                </div>

                {Object.keys(groupedOptional).length > 0 && (
                  <div className="flex flex-col gap-3">
                    <h2 className="text-sm font-medium">Optativas em oferta</h2>
                    <div className="flex flex-col gap-2">
                      {Object.entries(groupedOptional).map(([courseCode, courses]) => (
                        <Collapsible key={courseCode}>
                          <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 rounded-lg bg-muted/50 p-3 text-left transition-colors hover:bg-muted">
                            <div className="min-w-0">
                              <div className="font-mono text-sm font-medium">
                                {courseCode}
                              </div>
                              <div className="truncate text-xs text-muted-foreground">
                                {courses[0]?.name || courseCode} · {courses.length} turma
                                {courses.length > 1 ? "s" : ""}
                              </div>
                            </div>
                            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-2">
                            <AvailableClassList
                              availableClasses={courses}
                              loading={false}
                              error={null}
                              selectedClasses={planner.state.plannedClasses}
                              onSelectClass={handleClassSelect}
                              title=""
                              isCourseSelected={planner.isCourseSelected}
                              ignorePrereqs={ignorePrereqs}
                            />
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent
          value="schedule"
          forceMount
          className="mt-0 w-full min-w-0 data-[state=inactive]:hidden lg:sticky lg:top-[4.5rem] lg:z-10 lg:block lg:w-3/5 lg:max-h-[calc(100svh-3.5rem-4.5rem-1rem)] lg:overflow-y-auto lg:flex-none lg:self-start lg:data-[state=inactive]:block"
        >
          <WeeklyPlanner
            plannedClasses={planner.state.plannedClasses}
            onRemoveClass={handleClassRemove}
            onClearPlanner={planner.clearPlanner}
          />
        </TabsContent>
      </div>
    </Tabs>
  )
}
