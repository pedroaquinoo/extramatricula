"use client"

import { useEffect, useMemo, useState } from "react"
import {
  getClassesWithPrerequisites,
  getCourseById,
  loadCurriculum,
  isCurriculumLoaded,
} from "@/lib/curriculum"
import { useAppStore } from "@/lib/store"

export function useCourseData() {
  const { courseId, passed } = useAppStore()
  const [loaded, setLoaded] = useState(() => Boolean(courseId && isCurriculumLoaded(courseId)))

  useEffect(() => {
    if (!courseId) {
      setLoaded(false)
      return
    }

    if (isCurriculumLoaded(courseId)) {
      setLoaded(true)
      return
    }

    let cancelled = false
    setLoaded(false)

    loadCurriculum(courseId).then(() => {
      if (!cancelled) setLoaded(true)
    })

    return () => {
      cancelled = true
    }
  }, [courseId])

  const course = useMemo(
    () => (courseId ? getCourseById(courseId) : undefined),
    [courseId],
  )

  const classes = useMemo(
    () => (courseId && loaded ? getClassesWithPrerequisites(courseId) : []),
    [courseId, loaded],
  )

  const passedSet = useMemo(() => new Set(passed), [passed])

  return {
    courseId,
    course,
    classes,
    passed,
    passedSet,
    hasData: Boolean(courseId && loaded && classes.length > 0),
    isLoading: Boolean(courseId && !loaded),
  }
}
