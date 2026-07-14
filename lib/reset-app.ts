import { safeRemoveItem } from "@/lib/storage"

const STORAGE_KEYS = ["extramatricula:v1", "weekly-planner-state"]

export function resetApp() {
  for (const key of STORAGE_KEYS) {
    safeRemoveItem(key)
  }
  window.location.href = "/"
}
