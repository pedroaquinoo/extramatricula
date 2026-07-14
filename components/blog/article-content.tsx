import Link from "next/link"
import type { BlogArticle } from "@/lib/blog"

export function ArticleContent({ article }: { article: BlogArticle }) {
  return (
    <div className="space-y-8 text-pretty text-muted-foreground [&_strong]:font-medium [&_strong]:text-foreground">
      {article.sections.map((section) => (
        <section key={section.heading}>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            {section.heading}
          </h2>
          {section.paragraphs?.map((paragraph) => (
            <p key={paragraph} className="mt-3 leading-7">
              {paragraph}
            </p>
          ))}
          {section.bullets && (
            <ul className="mt-3 list-disc space-y-2 pl-5 leading-7">
              {section.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          )}
        </section>
      ))}

      <aside className="rounded-xl border bg-muted/30 p-5">
        <h2 className="font-semibold text-foreground">Continue no Extramatrícula</h2>
        <div className="mt-3 flex flex-col gap-2 text-sm">
          {article.relatedLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-medium text-foreground underline underline-offset-4"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </aside>
    </div>
  )
}
