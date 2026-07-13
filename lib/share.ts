import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string"
import { getCurrentOfferTerm } from "@/lib/offers"

export interface SharePick {
  course_id: string
  availabilityCode: string
}

export interface SharePayload {
  term: string
  courseId?: string
  semester: number | null
  picks: SharePick[]
}

const LEGACY_COURSE_ID = "controle-automacao-diurno"

export function encodeSharePayload(payload: SharePayload): string {
  return compressToEncodedURIComponent(JSON.stringify(payload))
}

export function decodeSharePayload(hash: string): SharePayload | null {
  try {
    const cleaned = hash.startsWith("#") ? hash.slice(1) : hash
    if (!cleaned) return null
    const json = decompressFromEncodedURIComponent(cleaned)
    if (!json) return null
    return JSON.parse(json) as SharePayload
  } catch {
    return null
  }
}

export function resolveShareCourseId(payload: SharePayload): string {
  return payload.courseId ?? LEGACY_COURSE_ID
}

export function buildSharePayload(
  courseId: string,
  semester: number | null,
  picks: SharePick[],
): SharePayload {
  return {
    term: getCurrentOfferTerm(),
    courseId,
    semester,
    picks,
  }
}

export function isTermCurrent(term: string): boolean {
  return term === getCurrentOfferTerm()
}
