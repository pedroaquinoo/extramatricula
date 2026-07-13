import posthog from "posthog-js"

import { getDegreeTitle } from "@/lib/curriculum"
import { getCurrentOfferTerm } from "@/lib/offers"
import { AnalyticsEvents } from "@/lib/analytics-events"

const analyticsEnabled = Boolean("phc_B9FEPkwx4CT2kf6dCyNfEwgUIdVCVg7J8unhgqyuwsR")

let progressTimer: ReturnType<typeof setTimeout> | undefined

export function captureEvent(
  event: string,
  properties?: Record<string, unknown>,
) {
  if (!analyticsEnabled) return
  posthog.capture(event, properties)
}

export function registerAnalyticsContext(courseId: string, semester: number) {
  if (!analyticsEnabled) return
  posthog.register({
    course_title: getDegreeTitle(courseId),
    semester,
    offer_term: getCurrentOfferTerm(),
  })
}

export function trackCourseProgressUpdated(passedCount: number, totalCount: number) {
  if (!analyticsEnabled) return
  if (progressTimer) clearTimeout(progressTimer)
  progressTimer = setTimeout(() => {
    captureEvent(AnalyticsEvents.COURSE_PROGRESS_UPDATED, {
      passed_count: passedCount,
      total_count: totalCount,
    })
  }, 30_000)
}
