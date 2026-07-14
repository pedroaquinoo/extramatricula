"use client"

import { useEffect, useMemo, useState } from "react"
import {
  getClassesWithPrerequisites,
  getCourseById,
  loadCurriculum,
} from "@/lib/curriculum"
import { useAppStore } from "@/lib/store"

export function useCourseData() {
  const { courseId, passed } = useAppStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadedCourseId, setLoadedCourseId] = useState("")

  useEffect(() => {
    if (!courseId) {
      setLoadedCourseId("")
      setIsLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)

    loadCurriculum(courseId).then((data) => {
      if (cancelled) return
      if (!data) {
        setError("Não foi possível carregar a grade do curso.")
        setLoadedCourseId("")
      } else {
        setLoadedCourseId(courseId)
      }
      setIsLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [courseId])

  const course = useMemo(
    () => (courseId ? getCourseById(courseId) : undefined),
    [courseId],
  )

  const classes = useMemo(() => {
    if (!courseId || loadedCourseId !== courseId) return []
    return getClassesWithPrerequisites(courseId)
  }, [courseId, loadedCourseId])

  const passedSet = useMemo(() => new Set(passed), [passed])

  return {
    courseId,
    course,
    classes,
    passed,
    passedSet,
    hasData: Boolean(courseId && loadedCourseId === courseId && classes.length > 0),
    isLoading,
    error,
  }
}
