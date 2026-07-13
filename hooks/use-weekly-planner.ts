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
const DEBOUNCE_MS = 300

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
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setState(readStorage())
    hydrated.current = true
  }, [])

  // Debounced localStorage persistence with error handling
  useEffect(() => {
    if (!hydrated.current) return

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      } catch {
        // Silently handle QuotaExceededError or other storage failures
      }
    }, DEBOUNCE_MS)

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
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

      const filtered = prev.plannedClasses.filter((c) => {
        if (c.course_id !== availableClass.course_id) return true
        return isP
          ? !c.availabilityCode.startsWith("P")
          : c.availabilityCode.startsWith("P")
      })

      return { plannedClasses: [...filtered, planned] }
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
    removeClass,
    clearPlanner,
    isClassSelected,
    isCourseSelected,
  }
}
