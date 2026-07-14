"use client"

import { useEffect, useMemo, useState } from "react"
import { getOfferId } from "@/lib/curriculum"
import { getCurrentOfferTerm, getOfferForProgram, loadOffer } from "@/lib/offers"
import { useAppStore } from "@/lib/store"

export interface AvailableClass {
  course_id: string
  name: string
  availabilityCode: string
  spots: number
  times: Array<{
    day: string
    start: string
    end: string
  }>
  teachers: string[]
}

export function useAvailableClasses() {
  const { courseId } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [loadedCourseId, setLoadedCourseId] = useState("")

  useEffect(() => {
    if (!courseId) {
      setLoadedCourseId("")
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    const term = getCurrentOfferTerm()
    const offerId = getOfferId(courseId)

    loadOffer(term, offerId).then(() => {
      if (cancelled) return
      setLoadedCourseId(courseId)
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [courseId])

  const availableClasses = useMemo(() => {
    if (!courseId || loadedCourseId !== courseId) return []
    return getOfferForProgram(getCurrentOfferTerm(), courseId)
  }, [courseId, loadedCourseId])

  const error = useMemo(() => {
    if (!courseId || loading || loadedCourseId !== courseId) return null
    if (availableClasses.length > 0) return null
    return "Nenhuma oferta encontrada para este curso no semestre atual."
  }, [courseId, loading, loadedCourseId, availableClasses.length])

  return {
    availableClasses,
    loading,
    error,
  }
}
