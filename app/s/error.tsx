"use client"

import { useEffect } from "react"

export default function SharedError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[Extramatricula] Shared schedule error:", error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <h2 className="text-lg font-semibold">Erro ao carregar grade compartilhada</h2>
      <p className="text-sm text-muted-foreground">
        O link pode estar corrompido ou o formato não é mais suportado.
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
