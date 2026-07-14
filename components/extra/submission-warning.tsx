"use client"

import { useState } from "react"
import { AlertTriangle, CheckCircle2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { captureEvent } from "@/lib/analytics"
import { AnalyticsEvents } from "@/lib/analytics-events"
import { cn } from "@/lib/utils"

export function SubmissionWarning({
  hasWarnings = true,
  className,
}: {
  hasWarnings?: boolean
  className?: string
}) {
  const [open, setOpen] = useState(false)

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) {
      captureEvent(AnalyticsEvents.SUBMISSION_WARNING_VIEWED, {})
    }
  }

  if (!hasWarnings) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        aria-disabled
        className={cn(
          "gap-2 col-span-1 text-muted-foreground disabled:opacity-100",
          className,
        )}
      >
        <CheckCircle2 className="h-4 w-4" />
        Tudo ok!
      </Button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button
        onClick={() => handleOpenChange(true)}
        variant="outline"
        size="sm"
        className={cn(
          "gap-2 col-span-1 border-amber-500/50 text-amber-700 hover:bg-amber-500/10 hover:text-amber-800 dark:text-amber-300 dark:hover:text-amber-200",
          className,
        )}
      >
        <AlertTriangle className="h-4 w-4" />
        Atenção!
      </Button>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="size-4 text-amber-500" />
            Sobre o envio no SIGA
          </DialogTitle>
          <DialogDescription>Isto é só uma simulação.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            Ao enviar o requerimento, o sistema pode recusar turmas com um aviso como{" "}
            <br />
            <span className="font-medium text-foreground">
              &ldquo;você não pode cursar disciplinas de 3 períodos consecutivos&rdquo;
            </span>
            .
          </p>
          <p>Se isso ocorrer, aproxime os períodos das turmas e envie de novo.</p>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Entendi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
