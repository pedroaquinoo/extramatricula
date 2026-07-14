"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ResetAppButton } from "@/components/extra/reset-app-button"

interface AppErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export function AppError({ error, reset }: AppErrorProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[50vh] flex-col items-start gap-4 p-8">
      <h1 className="text-lg font-semibold">Algo deu errado</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Ocorreu um erro inesperado. Você pode tentar novamente ou recomeçar do zero.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="default" size="sm" onClick={reset}>
          Tentar novamente
        </Button>
        <ResetAppButton />
      </div>
    </div>
  )
}
