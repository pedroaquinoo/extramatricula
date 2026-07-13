"use client"

import { useEffect } from "react"

export default function SimulationError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[Extramatricula] Simulation page error:", error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <h2 className="text-lg font-semibold">Erro na simulação</h2>
      <p className="text-sm text-muted-foreground">
        Não foi possível carregar a página de simulação. Tente novamente.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Tentar novamente
        </button>
        <a href="/" className="rounded-lg border px-4 py-2 text-sm font-medium">
          Voltar ao início
        </a>
      </div>
    </div>
  )
}
