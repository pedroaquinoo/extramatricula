"use client"

import { useEffect, useState } from "react"
import { Star } from "lucide-react"

import { cn } from "@/lib/utils"
import { GITHUB_REPO, GITHUB_URL } from "./constants"

export const STAR_URL = GITHUB_URL

// Shared across mounts so the four call sites hit the API once per page load.
let cachedStars: number | null = null
let pending: Promise<number | null> | null = null

function fetchStars() {
  pending ??= fetch(`https://api.github.com/repos/${GITHUB_REPO}`)
    .then((res) => (res.ok ? res.json() : null))
    .then((data: { stargazers_count?: number } | null) => {
      const count = data?.stargazers_count
      cachedStars = typeof count === "number" ? count : null
      return cachedStars
    })
    .catch(() => null)

  return pending
}

export function useGithubStars() {
  const [stars, setStars] = useState<number | null>(cachedStars)

  useEffect(() => {
    if (cachedStars !== null) return

    let active = true
    fetchStars().then((count) => {
      if (active && count !== null) setStars(count)
    })

    return () => {
      active = false
    }
  }, [])

  return stars
}

export function formatStars(stars: number) {
  return stars >= 1000 ? `${(stars / 1000).toFixed(1)}k` : String(stars)
}

/** Star icon + count. Renders nothing until the count is known. */
export function GithubStarCount({
  className,
  icon = true,
}: {
  className?: string
  icon?: boolean
}) {
  const stars = useGithubStars()
  if (stars === null) return null

  return (
    <span className={cn("inline-flex items-center gap-1 tabular-nums", className)}>
      {icon && <Star className="size-3 fill-yellow-500 text-yellow-500" />}
      {formatStars(stars)}
    </span>
  )
}
