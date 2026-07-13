const STORAGE_KEYS = ["extramatricula:v1", "weekly-planner-state"]

export function resetApp() {
  try {
    for (const key of STORAGE_KEYS) {
      localStorage.removeItem(key)
    }
  } catch {
    // ignore — reload below still gives the user a clean slate
  }
  window.location.href = "/"
}
