import posthog from "posthog-js"

// Analytics are owner-only: events are captured only when PostHog was
// initialized with NEXT_PUBLIC_POSTHOG_KEY (set exclusively in the owner's
// deployment). Without a key — the default for forks and clones — this is a
// no-op and nothing is ever sent.
const analyticsEnabled = Boolean("phc_B9FEPkwx4CT2kf6dCyNfEwgUIdVCVg7J8unhgqyuwsR")

export function captureEvent(
  event: string,
  properties?: Record<string, unknown>,
) {
  if (!analyticsEnabled) return
  posthog.capture(event, properties)
}
