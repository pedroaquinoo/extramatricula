"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, LibraryBig, Network, NotebookPen, HelpCircle } from "lucide-react"
import React, { useEffect } from "react"

import { registerAnalyticsContext } from "@/lib/analytics"
import { useAppStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import GithubIcon from "@/components/landing/github-icon"
import { GithubStarCount, STAR_URL } from "@/components/landing/github-stars"
import MatriculaTimeline from "@/components/landing/matricula-timeline"
import Logo from "./logo"

const navigation = [
  {
    title: "Início",
    shortTitle: "Início",
    icon: Home,
    href: "/",
  },
  {
    title: "Grade curricular",
    shortTitle: "Grade",
    icon: LibraryBig,
    href: "/course",
  },
  {
    title: "Fluxograma",
    shortTitle: "Fluxo",
    icon: Network,
    href: "/flow",
  },
  {
    title: "Simulação",
    shortTitle: "Simulação",
    icon: NotebookPen,
    href: "/simulation",
  },
  {
    title: "Por quê?",
    shortTitle: "Por quê?",
    icon: HelpCircle,
    href: "/why",
  },
]

function TopBar({ pathname }: { pathname: string }) {
  return (
    <header className="z-40 shrink-0 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
        <Link href="/" className="shrink-0">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navigation
            .filter((item) => item.href !== "/")
            .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
                  pathname === item.href
                    ? "bg-accent font-medium text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                )}
              >
                <item.icon className="size-4" />
                {item.title}
              </Link>
            ))}
        </nav>

        <div className="ml-auto flex min-w-0 items-center gap-2">
          <MatriculaTimeline />
          <Button
            variant="outline"
            size="sm"
            asChild
            aria-label="Deixe uma estrela no GitHub se o app te ajudou"
          >
            <a href={STAR_URL} target="_blank" rel="noreferrer">
              <GithubIcon className="size-4" />
              <span className="hidden sm:inline">Estrelar</span>
              <GithubStarCount className="text-xs text-muted-foreground" />
            </a>
          </Button>
        </div>
      </div>
    </header>
  )
}

function BottomTabBar({ pathname }: { pathname: string }) {
  return (
    <nav className="shrink-0 border-t bg-background/95 pb-[max(0px,calc(env(safe-area-inset-bottom)-0.5rem))] backdrop-blur md:hidden">
      <div className="flex h-16 items-stretch">
        {navigation.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 text-[11px] transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <item.icon className="size-5" />
              {item.shortTitle}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export function AppNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { courseId, semester } = useAppStore()

  useEffect(() => {
    if (courseId && semester) {
      registerAnalyticsContext(courseId, semester)
    }
  }, [courseId, semester])

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <TopBar pathname={pathname} />
      <main className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]">
        {children}
      </main>
      <BottomTabBar pathname={pathname} />
    </div>
  )
}
