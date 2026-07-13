export const AnalyticsEvents = {
  SETUP_COMPLETED: "setup_completed",
  CLASS_ADDED: "class_added",
  CLASS_REMOVED: "class_removed",
  SIMULATION_SHARED: "simulation_shared",
  CTA_CLICKED: "cta_clicked",
  SHARED_SCHEDULE_VIEWED: "shared_schedule_viewed",
  COURSE_PROGRESS_UPDATED: "course_progress_updated",
} as const

export type CtaName = "simulate" | "flow"
