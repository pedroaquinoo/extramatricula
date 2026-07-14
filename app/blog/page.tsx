import Link from "next/link"
import type { Metadata } from "next"
import { ArrowRight } from "lucide-react"
import LandingFooter from "@/components/landing/landing-footer"
import { blogArticles } from "@/lib/blog"

export const metadata: Metadata = {
  title: "Guia da matrícula na UFMG",
  description:
    "Guias práticos para entender a matrícula, os pré-requisitos e o planejamento da sua grade na UFMG.",
}

export default function BlogPage() {
  return (
    <div className="flex flex-col">
      <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:py-20">
        <header className="max-w-2xl">
          <p className="text-xs font-medium tracking-wide text-primary uppercase">
            Guia UFMG
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Planeje sua matrícula com mais calma
          </h1>
          <p className="mt-4 text-lg text-pretty text-muted-foreground">
            Guias práticos sobre matrícula, pré-requisitos, horários e grade curricular
            para estudantes da UFMG.
          </p>
        </header>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {blogArticles.map((article) => (
            <Link
              key={article.slug}
              href={`/blog/${article.slug}`}
              className="group rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <article className="flex h-full flex-col rounded-xl border bg-card p-5 transition-colors group-hover:bg-accent/40">
                <p className="text-xs font-medium tracking-wide text-primary uppercase">
                  {article.category}
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight text-balance group-hover:underline">
                  {article.title}
                </h2>
                <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">
                  {article.description}
                </p>
                <div className="mt-5 flex justify-end text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1 font-medium text-foreground">
                    Ler guia <ArrowRight className="size-3.5" />
                  </span>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </main>
      <LandingFooter />
    </div>
  )
}
