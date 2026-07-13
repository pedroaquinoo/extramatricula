"use client"

import { useEffect, useMemo, useState } from "react"
import {
  getCurrentOfferForProgram,
  getCurrentOfferTerm,
  isOfferLoaded,
  loadOffer,
} from "@/lib/offers"
import { getOfferId } from "@/lib/curriculum"
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
  const [loaded, setLoaded] = useState(() => {
    if (!courseId) return false
    const offerId = getOfferId(courseId)
    const term = getCurrentOfferTerm()
    return isOfferLoaded(term, offerId)
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!courseId) {
      setLoaded(false)
      setLoading(false)
      return
    }

    const offerId = getOfferId(courseId)
    const term = getCurrentOfferTerm()

    if (isOfferLoaded(term, offerId)) {
      setLoaded(true)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setLoaded(false)

    loadOffer(term, offerId).then(() => {
      if (!cancelled) {
        setLoaded(true)
        setLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [courseId])

  const availableClasses = useMemo(() => {
    if (!courseId || !loaded) return []
    return getCurrentOfferForProgram(courseId)
  }, [courseId, loaded])

  const error = useMemo(() => {
    if (!courseId) return null
    if (loading) return null
    if (loaded && availableClasses.length > 0) return null
    if (loaded && availableClasses.length === 0) {
      return "Nenhuma oferta encontrada para este curso no semestre atual."
    }
    return null
  }, [courseId, loading, loaded, availableClasses.length])

  return {
    availableClasses,
    loading,
    error,
  }
}
