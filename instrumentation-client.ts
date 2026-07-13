import posthog from "posthog-js"

// Analytics are owner-only and opt-in. PostHog initializes only when
// NEXT_PUBLIC_POSTHOG_KEY is present at build time, which is set exclusively in
// the owner's deployment environment (never committed). Forks and clones have no
// key, so analytics stay disabled by default and never send events anywhere.
const posthogKey = "phc_B9FEPkwx4CT2kf6dCyNfEwgUIdVCVg7J8unhgqyuwsR"

if (posthogKey) {
  posthog.init(posthogKey, {
    api_host: "https://us.i.posthog.com",
    ui_host: "https://us.posthog.com",
    defaults: "2025-05-24",
    capture_exceptions: true,
    disable_surveys: true,
    debug: process.env.NODE_ENV === "development",
  })
}
