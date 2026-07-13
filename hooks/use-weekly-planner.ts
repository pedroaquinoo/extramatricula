"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { AvailableClass } from "./use-available-classes"

export interface PlannedClass extends AvailableClass {
  id: string
}

export interface WeeklyPlannerState {
  plannedClasses: PlannedClass[]
}

const STORAGE_KEY = "weekly-planner-state"

const emptyState: WeeklyPlannerState = { plannedClasses: [] }

function readStorage(): WeeklyPlannerState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return emptyState
    const parsed = JSON.parse(saved) as Partial<WeeklyPlannerState>
    return {
      plannedClasses: Array.isArray(parsed.plannedClasses) ? parsed.plannedClasses : [],
    }
  } catch {
    return emptyState
  }
}

export function useWeeklyPlanner() {
  const [state, setState] = useState<WeeklyPlannerState>(emptyState)
  const hydrated = useRef(false)

  // Reading localStorage during the first render would disagree with the server-rendered
  // markup, so the saved plan lands right after hydration instead.
  useEffect(() => {
    setState(readStorage())
    hydrated.current = true
  }, [])

  useEffect(() => {
    if (!hydrated.current) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const addClass = useCallback((availableClass: AvailableClass) => {
    setState((prev) => {
      const sameCourse = prev.plannedClasses.filter(
        (c) => c.course_id === availableClass.course_id,
      )
      const isP = availableClass.availabilityCode.startsWith("P")
      const alreadySelected = sameCourse.some(
        (c) => c.availabilityCode === availableClass.availabilityCode,
      )
      if (alreadySelected) return prev

      const planned: PlannedClass = {
        ...availableClass,
        id: `${availableClass.course_id}-${availableClass.availabilityCode}`,
      }

      if (sameCourse.length === 0) {
        return { plannedClasses: [...prev.plannedClasses, planned] }
      }

      // A course keeps at most one lecture and one lab section: picking another of the
      // same kind replaces it, while lecture and lab coexist.
      const filtered = prev.plannedClasses.filter((c) => {
        if (c.course_id !== availableClass.course_id) return true
        return isP
          ? !c.availabilityCode.startsWith("P")
          : c.availabilityCode.startsWith("P")
      })

      return { plannedClasses: [...filtered, planned] }
    })
  }, [])

  // Replace the whole plan in one shot — used when loading a full schedule (magic mode, share)
  // rather than toggling classes one at a time.
  const setPlan = useCallback((classes: AvailableClass[]) => {
    setState({
      plannedClasses: classes.map((cls) => ({
        ...cls,
        id: `${cls.course_id}-${cls.availabilityCode}`,
      })),
    })
  }, [])

  const removeClass = useCallback((classId: string) => {
    setState((prev) => ({
      plannedClasses: prev.plannedClasses.filter((cls) => cls.id !== classId),
    }))
  }, [])

  const clearPlanner = useCallback(() => {
    setState(emptyState)
  }, [])

  const isClassSelected = useCallback(
    (availableClass: AvailableClass) =>
      state.plannedClasses.some(
        (cls) =>
          cls.course_id === availableClass.course_id &&
          cls.availabilityCode === availableClass.availabilityCode,
      ),
    [state.plannedClasses],
  )

  const isCourseSelected = useCallback(
    (courseId: string) => state.plannedClasses.some((cls) => cls.course_id === courseId),
    [state.plannedClasses],
  )

  return {
    state,
    addClass,
    setPlan,
    removeClass,
    clearPlanner,
    isClassSelected,
    isCourseSelected,
  }
}
