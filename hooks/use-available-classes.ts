import { useMemo } from "react"
import { getCurrentOfferForProgram } from "@/lib/offers"
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

const cache = new Map<string, AvailableClass[]>()

export function useAvailableClasses() {
  const { courseId } = useAppStore()

  const availableClasses = useMemo(() => {
    if (!courseId) return []
    if (!cache.has(courseId)) {
      cache.set(courseId, getCurrentOfferForProgram(courseId))
    }
    return cache.get(courseId) ?? []
  }, [courseId])

  const error = useMemo(() => {
    if (!courseId) return null
    if (availableClasses.length > 0) return null
    return "Nenhuma oferta encontrada para este curso no semestre atual."
  }, [courseId, availableClasses.length])

  return {
    availableClasses,
    loading: false,
    error,
  }
}
