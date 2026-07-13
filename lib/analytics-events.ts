export const AnalyticsEvents = {
  SETUP_COMPLETED: "setup_completed",
  CLASS_ADDED: "class_added",
  CLASS_REMOVED: "class_removed",
  SIMULATION_SHARED: "simulation_shared",
  CTA_CLICKED: "cta_clicked",
  SHARED_SCHEDULE_VIEWED: "shared_schedule_viewed",
  COURSE_PROGRESS_UPDATED: "course_progress_updated",
  OTHER_TURMAS_VIEWED: "other_turmas_viewed",
  SUBMISSION_WARNING_VIEWED: "submission_warning_viewed",
  MAGIC_MODE_OPENED: "magic_mode_opened",
  MAGIC_MODE_RUN: "magic_mode_run",
  MAGIC_MODE_RUN_COMPLETED: "magic_mode_run_completed",
  MAGIC_MODE_APPLIED: "magic_mode_applied",
  PREREQS_IGNORED: "prereqs_ignored",
} as const

export type CtaName = "simulate" | "flow"
