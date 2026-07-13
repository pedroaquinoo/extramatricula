"use client"

import { useEffect } from "react"

export default function FlowError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[Extramatricula] Flow page error:", error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <h2 className="text-lg font-semibold">Erro no fluxograma</h2>
      <p className="text-sm text-muted-foreground">
        Não foi possível renderizar o gráfico. Isso pode acontecer em
        dispositivos com pouca memória.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Tentar novamente
        </button>
        <a href="/simulation" className="rounded-lg border px-4 py-2 text-sm font-medium">
          Ir para simulação
        </a>
      </div>
    </div>
  )
}
