"use client"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="pt-BR">
      <body className="flex min-h-screen items-center justify-center bg-background p-8 antialiased">
        <div className="flex max-w-md flex-col items-center gap-4 text-center">
          <h1 className="text-xl font-bold">Algo deu errado</h1>
          <p className="text-sm text-muted-foreground">
            Ocorreu um erro inesperado no aplicativo.
          </p>
          <div className="flex gap-3">
            <button
              onClick={reset}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Tentar novamente
            </button>
            <button
              onClick={() => {
                try { localStorage.clear() } catch {}
                window.location.href = "/"
              }}
              className="rounded-lg border px-4 py-2 text-sm font-medium"
            >
              Limpar dados e recarregar
            </button>
          </div>
          {error?.digest && (
            <p className="mt-2 text-xs text-muted-foreground">
              Codigo: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  )
}
