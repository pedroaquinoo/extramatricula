import React from "react"
import { Geist } from "next/font/google"
import type { Metadata } from "next"
import { AppNav } from "@/components/extra/app-nav"
import { SetupDialog } from "@/components/extra/setup-dialog"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://extramatricula.pedroaquinoo.com"),
  title: "Extramatricula",
  description: "Planeje seus semestres",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${geist.variable} antialiased`}>
        <AppNav>{children}</AppNav>
        <SetupDialog />
        <Toaster richColors position="bottom-center" />
      </body>
    </html>
  )
}
