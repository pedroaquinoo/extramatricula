"use client"

import { Button } from "@/components/ui/button"
import { resetApp } from "@/lib/reset-app"

export function ResetAppButton() {
  return (
    <Button variant="outline" size="sm" onClick={resetApp}>
      Recomeçar
    </Button>
  )
}
