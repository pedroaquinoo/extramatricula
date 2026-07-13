"use client"

import { useMemo } from "react"
import { getClassesWithPrerequisites, getCourseById } from "@/lib/curriculum"
import { useAppStore } from "@/lib/store"

export function useCourseData() {
  const { courseId, passed } = useAppStore()

  const course = useMemo(
    () => (courseId ? getCourseById(courseId) : undefined),
    [courseId],
  )

  const classes = useMemo(
    () => (courseId ? getClassesWithPrerequisites(courseId) : []),
    [courseId],
  )

  const passedSet = useMemo(() => new Set(passed), [passed])

  return {
    courseId,
    course,
    classes,
    passed,
    passedSet,
    hasData: Boolean(courseId && classes.length > 0),
    isLoading: false,
  }
}
