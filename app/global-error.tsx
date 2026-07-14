"use client"

import { Geist } from "next/font/google"
import { AppError } from "@/components/extra/app-error"
import "@/app/globals.css"

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
})

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="pt-BR">
      <body className={`${geist.variable} antialiased`}>
        <AppError error={error} reset={reset} />
      </body>
    </html>
  )
}
