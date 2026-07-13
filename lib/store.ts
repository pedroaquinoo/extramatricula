"use client"

import { useCallback, useSyncExternalStore } from "react"

import { trackCourseProgressUpdated } from "@/lib/analytics"
import { getClasses } from "@/lib/curriculum"

const STORAGE_KEY = "extramatricula:v1"

export interface AppState {
  version: 1
  courseId: string
  semester: number | null
  passed: string[]
}

const defaultState: AppState = {
  version: 1,
  courseId: "",
  semester: null,
  passed: [],
}

let state: AppState = defaultState
let hydrated = false
const listeners = new Set<() => void>()

function readStorage(): AppState {
  if (typeof window === "undefined") return defaultState
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState
    const parsed = JSON.parse(raw) as Partial<AppState>
    if (parsed.version !== 1) return defaultState
    return {
      version: 1,
      courseId: parsed.courseId ?? "",
      semester: typeof parsed.semester === "number" ? parsed.semester : null,
      passed: Array.isArray(parsed.passed) ? parsed.passed : [],
    }
  } catch {
    return defaultState
  }
}

function writeStorage(next: AppState) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

function emit() {
  listeners.forEach((listener) => listener())
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return
  state = readStorage()
  hydrated = true
}

function setState(updater: (current: AppState) => AppState) {
  hydrate()
  state = updater(state)
  writeStorage(state)
  emit()
}

export function getState(): AppState {
  hydrate()
  return state
}

export function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function emitCourseProgressUpdated(courseId: string, passedCount: number) {
  if (!courseId) return
  trackCourseProgressUpdated(passedCount, getClasses(courseId).length)
}

/**
 * Course, period and the history are always written in one shot, by the setup dialog:
 * splitting them would clear `passed` again the moment the course landed. The dialog
 * passes the full, already-reconciled `passed` set (it knows the curriculum), so we
 * write it verbatim instead of merging — merging would keep classes from periods the
 * user just moved *below*, e.g. when switching to an earlier semester.
 */
export function completeSetup(courseId: string, semester: number, passed: string[]) {
  setState((current) => ({
    ...current,
    courseId,
    semester,
    passed: Array.from(new Set(passed)),
  }))
}

export function togglePassed(code: string) {
  setState((current) => {
    const passed = new Set(current.passed)
    if (passed.has(code)) {
      passed.delete(code)
    } else {
      passed.add(code)
    }
    const next = { ...current, passed: Array.from(passed) }
    emitCourseProgressUpdated(next.courseId, next.passed.length)
    return next
  })
}

export function setManyPassed(codes: string[], value: boolean) {
  setState((current) => {
    const passed = new Set(current.passed)
    for (const code of codes) {
      if (value) passed.add(code)
      else passed.delete(code)
    }
    const next = { ...current, passed: Array.from(passed) }
    emitCourseProgressUpdated(next.courseId, next.passed.length)
    return next
  })
}

export function useAppStore() {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => getState(),
    () => defaultState,
  )

  const finishSetup = useCallback(
    (courseId: string, semester: number, passed: string[]) =>
      completeSetup(courseId, semester, passed),
    [],
  )
  const toggle = useCallback((code: string) => togglePassed(code), [])
  const setMany = useCallback(
    (codes: string[], value: boolean) => setManyPassed(codes, value),
    [],
  )

  return {
    ...snapshot,
    completeSetup: finishSetup,
    togglePassed: toggle,
    setManyPassed: setMany,
  }
}
