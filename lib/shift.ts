import type { Course } from "@/lib/types/curriculum"

export type Shift = "diurno" | "noturno"

const NIGHT_START_MINUTES = 18 * 60

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

export function getShift(course: Course | undefined): Shift | null {
  if (!course) return null
  if (course.shift) return course.shift
  return course.name.toLowerCase().includes("noturno") ? "noturno" : "diurno"
}

export function formatShiftLabel(shift: Shift): string {
  return shift === "noturno" ? "Noturno" : "Diurno"
}

type ClassTime = { start: string }

function hasNightSession(times: ClassTime[]): boolean {
  return times.some((time) => toMinutes(time.start) >= NIGHT_START_MINUTES)
}

function isDaytimeOnly(times: ClassTime[]): boolean {
  return times.length > 0 && times.every((time) => toMinutes(time.start) < NIGHT_START_MINUTES)
}

export function isOffShift(shift: Shift | null, times: ClassTime[]): boolean {
  if (!shift) return false
  return shift === "diurno" ? hasNightSession(times) : isDaytimeOnly(times)
}
