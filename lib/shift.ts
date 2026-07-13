import type { Course } from "@/lib/types/curriculum"

export type Shift = "diurno" | "vespertino" | "noturno"

export const SHIFT_ORDER: Shift[] = ["diurno", "vespertino", "noturno"]

const MORNING_END_MINUTES = 12 * 60
const NIGHT_START_MINUTES = 18 * 60

const SHIFT_LABELS: Record<Shift, string> = {
  diurno: "Diurno",
  vespertino: "Vespertino",
  noturno: "Noturno",
}

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

function inferShiftFromId(id: string): Shift | null {
  if (id.endsWith("-vespertino")) return "vespertino"
  if (id.endsWith("-noturno")) return "noturno"
  if (id.endsWith("-diurno")) return "diurno"
  return null
}

export function compareShifts(a: Shift, b: Shift): number {
  return SHIFT_ORDER.indexOf(a) - SHIFT_ORDER.indexOf(b)
}

export function getShift(course: Course | undefined): Shift | null {
  if (!course) return null
  const fromId = inferShiftFromId(course.id)
  if (fromId) return fromId
  if (course.shift) return course.shift
  const name = course.name.toLowerCase()
  if (name.includes("noturno")) return "noturno"
  if (name.includes("vespertino")) return "vespertino"
  return "diurno"
}

export function formatShiftLabel(shift: Shift): string {
  return SHIFT_LABELS[shift]
}

type ClassTime = { start: string }

function hasNightSession(times: ClassTime[]): boolean {
  return times.some((time) => toMinutes(time.start) >= NIGHT_START_MINUTES)
}

function isDaytimeOnly(times: ClassTime[]): boolean {
  return (
    times.length > 0 && times.every((time) => toMinutes(time.start) < NIGHT_START_MINUTES)
  )
}

function isMorningOnly(times: ClassTime[]): boolean {
  return (
    times.length > 0 && times.every((time) => toMinutes(time.start) < MORNING_END_MINUTES)
  )
}

export function isOffShift(shift: Shift | null, times: ClassTime[]): boolean {
  if (!shift) return false
  if (shift === "noturno") return isDaytimeOnly(times)
  if (shift === "vespertino") return hasNightSession(times) || isMorningOnly(times)
  return hasNightSession(times)
}
