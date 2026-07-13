import Link from "next/link"
import type { Metadata } from "next"
import { Button } from "@/components/ui/button"
import {
  ArrowRight,
  Check,
  Upload as UploadIcon,
  Star,
  Sun,
  Workflow,
} from "lucide-react"
import LandingFooter from "@/components/landing/landing-footer"
import SchedulePreview from "@/components/landing/schedule-preview"
import MatriculaTimeline from "@/components/landing/matricula-timeline"
import ClassDetailPreview from "@/components/landing/class-detail-preview"
import GithubIcon from "@/components/landing/github-icon"
import { GITHUB_REPO, GITHUB_URL } from "@/components/landing/constants"
import { GithubStarCount, STAR_URL } from "@/components/landing/github-stars"
import { ShareAppButton } from "@/components/landing/share-app-button"
import { getCourseGroups } from "@/lib/curriculum"
import { formatShiftLabel } from "@/lib/shift"

export const metadata: Metadata = {
  title: "Extramatrícula: monte sua grade antes de se matricular",
  description:
    "Simule o próximo semestre com as turmas realmente em oferta na UFMG e veja sua semana antes da matrícula. Código aberto.",
}

const features = [
  {
    icon: Workflow,
    title: "Pré-requisitos como diagrama",
    text: "A grade curricular vira um fluxograma. Disciplinas bloqueadas aparecem trancadas, com o que falta para liberar.",
  },
  {
    icon: UploadIcon,
    title: "Grade compartilhável",
    text: "Um clique gera um link público da sua semana. Quem abrir vê a grade sem precisar de conta.",
  },
  {
    icon: Sun,
    title: "Disciplinas já cursadas",
    text: "Marque o que você já passou na grade curricular. O fluxograma usa isso para mostrar o que você pode cursar em seguida. Tudo fica salvo neste navegador.",
  },
]

export default function LandingPage() {
  const courses = getCourseGroups()

  return (
    <div className="flex flex-col">
      <div>
        {/* Hero */}
        <section className="mx-auto max-w-5xl px-4 pt-12 pb-10 sm:pt-20 sm:pb-14">
          <div className="mx-auto max-w-2xl text-center">
            <a
              href={STAR_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent"
            >
              <GithubIcon className="size-3" />
              Open source · {GITHUB_REPO}
              <GithubStarCount className="border-l pl-1.5 font-medium text-foreground" />
            </a>

            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
              Monte sua grade da UFMG antes de se matricular
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-base text-pretty text-muted-foreground sm:text-lg">
              Evite conflitos de horário e consiga se planejar melhor <br />
              <span className="font-medium text-foreground">
                Gratuito e sem precisar de cadastro.
              </span>
            </p>

            <div className="mt-7 flex flex-col items-center justify-center gap-2 sm:flex-row">
              <Button size="lg" className="w-full sm:w-auto" asChild>
                <Link href="/simulation">
                  Simular meu semestre
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
                <Link href="/flow">Ver fluxograma</Link>
              </Button>
            </div>
          </div>

          <div id="simulacao" className="mt-10 scroll-mt-20 sm:mt-14">
            <SchedulePreview />
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Clique numa turma para adicioná-la à semana. Trocar de turma substitui a
              anterior; aula e laboratório convivem.
            </p>
          </div>
        </section>

        {/* Cronograma da matrícula */}
        <section className="text-primary-foreground">
          <div className="mx-auto max-w-3xl rounded-lg bg-primary p-6 mb-4">
            <MatriculaTimeline />
          </div>
        </section>

        {/* Descrição das disciplinas */}
        <section className="border-t bg-muted/30">
          <div className="mx-auto grid max-w-5xl gap-8 px-4 py-14 sm:py-20 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-xs font-medium tracking-wide text-primary uppercase">
                Disciplinas
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                Saiba o que você vai cursar
              </h2>
              <p className="mt-3 text-pretty text-muted-foreground">
                Abra qualquer disciplina e veja a ementa, os créditos, o período de
                referência, os pré-requisitos que ela exige e as disciplinas que ela
                desbloqueia mais à frente. Tudo direto do SigaUFMG.
              </p>
            </div>
            <ClassDetailPreview />
          </div>
        </section>

        {/* Outras funcionalidades */}
        <section className="mx-auto max-w-5xl px-4 py-14 sm:py-20">
          <div className="grid gap-4 sm:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-xl border bg-card p-5">
                <f.icon className="size-5 text-primary" />
                <h3 className="mt-3 font-medium">{f.title}</h3>
                <p className="mt-1.5 text-sm text-pretty text-muted-foreground">
                  {f.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Cursos */}
        <section id="cursos" className="scroll-mt-16 border-t bg-muted/30">
          <div className="mx-auto max-w-5xl px-4 py-14 sm:py-20">
            <div className="max-w-xl">
              <p className="text-xs font-medium tracking-wide text-primary uppercase">
                Cursos
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                Disponível hoje
              </h2>
              <p className="mt-3 text-muted-foreground">
                Começamos pelo curso onde tudo nasceu. Cada curso novo é uma grade a mais
                no app, e a próxima pode ser a sua.
              </p>
            </div>

            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {courses.map((course) => (
                <li
                  key={course.offerId}
                  className="flex items-center gap-3 rounded-xl border bg-card p-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-balance">{course.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {course.shifts.map(formatShiftLabel).join(" · ")}
                    </p>
                  </div>
                  <Check className="ml-auto size-4 shrink-0 text-primary" />
                </li>
              ))}
            </ul>

            <p className="mt-4 text-sm text-muted-foreground">
              Estuda outro curso?{" "}
              <a
                href={`${GITHUB_URL}/issues`}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-foreground underline underline-offset-4"
              >
                Abra uma issue
              </a>{" "}
              e ajude a trazer a sua grade.
            </p>
          </div>
        </section>

        {/* Open source */}
        <section className="border-t">
          <div className="mx-auto max-w-5xl px-4 py-14 text-center sm:py-20">
            <span className="inline-flex size-11 items-center justify-center rounded-xl border bg-card">
              <GithubIcon className="size-5" />
            </span>

            <h2 className="mt-5 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              Feito por um estudante, aberto no GitHub
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-pretty text-muted-foreground">
              O Extramatrícula é um projeto iniciado por {" "}
              <span className="font-medium">Pedro Aquino</span> e o código
              está todo no GitHub. Se o app te ajudou, deixa uma estrela ou compartihe com seus amigos.
            </p>

            <div className="mt-7 flex flex-col items-center justify-center gap-2 sm:flex-row">
              <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
                <a href={STAR_URL} target="_blank" rel="noreferrer">
                  <Star className="size-4 fill-yellow-500 text-yellow-500" />
                  Deixe uma estrela se te ajudou
                  <GithubStarCount
                    icon={false}
                    className="rounded-full bg-primary-foreground/15 px-1.5 py-0.5 text-xs"
                  />
                </a>
              </Button>
              <ShareAppButton />
            </div>
          </div>
        </section>
      </div>

      <LandingFooter />
    </div>
  )
}
