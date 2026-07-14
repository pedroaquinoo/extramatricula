import Link from "next/link"
import Logo from "@/components/extra/logo"
import { ResetAppButton } from "@/components/extra/reset-app-button"
import GithubIcon from "./github-icon"
import { GITHUB_REPO } from "./constants"
import { GithubStarCount, STAR_URL } from "./github-stars"

export default function LandingFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Logo />
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            Planeje seus semestres na UFMG.
          </p>
        </div>

        <div className="flex flex-col gap-2 text-sm sm:items-end">
          <Link href="/course" className="text-muted-foreground hover:text-foreground">
            Grade curricular
          </Link>
          <Link href="/flow" className="text-muted-foreground hover:text-foreground">
            Fluxograma
          </Link>
          <Link
            href="/simulation"
            className="text-muted-foreground hover:text-foreground"
          >
            Simulação
          </Link>
          <Link href="/blog" className="text-muted-foreground hover:text-foreground">
            Guia da matrícula UFMG
          </Link>
          <a
            href={STAR_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <GithubIcon className="size-3.5" />
            {GITHUB_REPO}
            <GithubStarCount className="rounded-full border px-1.5 text-xs" />
          </a>
          {/* <p className="text-muted-foreground">
            Um projeto de{" "}
            <span className="font-medium text-foreground">Pedro Aquino</span>
          </p> */}
        </div>
      </div>

      <div className="border-t">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Projeto independente, sem vínculo oficial com a UFMG. Código aberto sob
            licença AGPL-3.0.
          </p>
          <ResetAppButton />
        </div>
      </div>
    </footer>
  )
}
