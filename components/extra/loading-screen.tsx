"use client"

import { ResetAppButton } from "@/components/extra/reset-app-button"
import { cn } from "@/lib/utils"

export function LoadingScreen({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-start gap-3 p-8", className)}>
      <p className="text-muted-foreground">Carregando...</p>
      <ResetAppButton />
    </div>
  )
}
