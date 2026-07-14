import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import LandingFooter from "@/components/landing/landing-footer"
import { ArticleContent } from "@/components/blog/article-content"
import { blogArticles, getArticle } from "@/lib/blog"
import { SITE_URL } from "@/lib/site"

export const dynamicParams = false

export function generateStaticParams() {
  return blogArticles.map(({ slug }) => ({ slug }))
}

type ArticlePageProps = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params
  const article = getArticle(slug)
  if (!article) return {}

  return {
    title: article.title,
    description: article.description,
    alternates: { canonical: `/blog/${article.slug}` },
    openGraph: {
      type: "article",
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      section: article.category,
      title: article.title,
      description: article.description,
      url: `/blog/${article.slug}`,
    },
  }
}

export default async function BlogArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params
  const article = getArticle(slug)
  if (!article) notFound()

  const url = `${SITE_URL}/blog/${article.slug}`
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: article.title,
        description: article.description,
        datePublished: article.publishedAt,
        dateModified: article.updatedAt,
        author: { "@type": "Person", name: "Pedro Aquino" },
        publisher: { "@type": "Organization", name: "Extramatrícula", url: SITE_URL },
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Guia UFMG",
            item: `${SITE_URL}/blog`,
          },
          { "@type": "ListItem", position: 2, name: article.title, item: url },
        ],
      },
    ],
  }

  return (
    <div className="flex flex-col">
      <main className="mx-auto w-full max-w-2xl px-4 py-12 sm:py-20">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          <Link href="/blog" className="hover:text-foreground">
            Guia UFMG
          </Link>
          <span className="px-2">/</span>
          <span>{article.category}</span>
        </nav>
        <article className="mt-8">
          <header>
            <p className="text-xs font-medium tracking-wide text-primary uppercase">
              {article.category}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              {article.title}
            </h1>
            <p className="mt-4 text-lg text-pretty text-muted-foreground">
              {article.description}
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              Atualizado em{" "}
              {new Intl.DateTimeFormat("pt-BR").format(
                new Date(`${article.updatedAt}T12:00:00`),
              )}
            </p>
          </header>
          <div className="mt-10">
            <ArticleContent article={article} />
          </div>
        </article>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </main>
      <LandingFooter />
    </div>
  )
}
