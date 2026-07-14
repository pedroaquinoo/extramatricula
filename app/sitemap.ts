import type { MetadataRoute } from "next"

import { SITE_URL } from "@/lib/site"
import { blogArticles } from "@/lib/blog"

export const dynamic = "force-static"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/why`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/course`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/flow`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/simulation`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: new Date("2026-07-14T12:00:00Z"),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...blogArticles.map((article) => ({
      url: `${SITE_URL}/blog/${article.slug}`,
      lastModified: new Date(`${article.updatedAt}T12:00:00Z`),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ]
}
