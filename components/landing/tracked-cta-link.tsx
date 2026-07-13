"use client"

import Link from "next/link"
import type { ReactNode } from "react"

import { captureEvent } from "@/lib/analytics"
import { AnalyticsEvents, type CtaName } from "@/lib/analytics-events"

export function TrackedCtaLink({
  href,
  cta,
  children,
  className,
}: {
  href: string
  cta: CtaName
  children: ReactNode
  className?: string
}) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => captureEvent(AnalyticsEvents.CTA_CLICKED, { cta })}
    >
      {children}
    </Link>
  )
}
