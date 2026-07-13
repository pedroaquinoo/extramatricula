import Link from "next/link"
import type { Metadata } from "next"
import { Button } from "@/components/ui/button"
import {
  ArrowRight,
  Upload as UploadIcon,
  Star,
  Sun,
  Workflow,
  ListChecks,
  CalendarClock,
  Share2,
} from "lucide-react"
import LandingFooter from "@/components/landing/landing-footer"
import SchedulePreview from "@/components/landing/schedule-preview"
import ClassDetailPreview from "@/components/landing/class-detail-preview"
import GithubIcon from "@/components/landing/github-icon"
import { GITHUB_REPO, GITHUB_URL } from "@/components/landing/constants"
import { GithubStarCount, STAR_URL } from "@/components/landing/github-stars"
import { ShareAppButton } from "@/components/landing/share-app-button"
import { TrackedCtaLink } from "@/components/landing/tracked-cta-link"
import { getCourseGroups } from "@/lib/curriculum"
import CoursesList from "@/components/landing/courses-list"

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

const steps = [
  {
    icon: ListChecks,
    title: "Marque o que já cursou",
    text: "Selecione na grade curricular as disciplinas que você já passou. Fica tudo salvo neste navegador.",
  },
  {
    icon: CalendarClock,
    title: "Simule a oferta do semestre",
    text: "Veja as turmas realmente em oferta e monte sua semana sem conflitos de horário.",
  },
  {
    icon: Share2,
    title: "Compartilhe sua grade",
    text: "Gere um link público da sua semana e mande para quem quiser — sem precisar de conta.",
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
                <TrackedCtaLink href="/simulation" cta="simulate">
                  Simular meu semestre
                  <ArrowRight className="size-4" />
                </TrackedCtaLink>
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
                <TrackedCtaLink href="/flow" cta="flow">
                  Ver fluxograma
                </TrackedCtaLink>
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

        {/* Como funciona · passo a passo */}
        <section className="border-t bg-muted/30">
          <div className="mx-auto max-w-5xl px-4 py-14 sm:py-20">
            <div className="mx-auto max-w-xl text-center">
              <p className="text-xs font-medium tracking-wide text-primary uppercase">
                Como funciona
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                Do zero à grade em três passos
              </h2>
            </div>

            <ol className="mt-10 grid gap-4 sm:grid-cols-3">
              {steps.map((step, i) => (
                <li
                  key={step.title}
                  className="flex flex-col rounded-xl border bg-card p-5"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <step.icon className="size-5" />
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-muted-foreground/60">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <h3 className="mt-4 font-medium">{step.title}</h3>
                  <p className="mt-1.5 text-sm text-pretty text-muted-foreground">
                    {step.text}
                  </p>
                </li>
              ))}
            </ol>

            <div className="mt-10 flex justify-center">
              <Button size="lg" asChild>
                <Link href="/simulation">
                  Começar agora
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
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
                desbloqueia mais à frente. 
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
              <p className="mt-4 flex items-baseline gap-2">
                <span className="text-4xl font-semibold tracking-tight tabular-nums text-primary sm:text-5xl">
                  {courses.length}
                </span>
                <span className="text-sm text-muted-foreground">
                  {courses.length === 1 ? "curso disponível" : "cursos disponíveis"}
                </span>
              </p>
              <p className="mt-3 text-muted-foreground">
                Começamos pelo curso onde tudo nasceu. Cada curso novo é uma grade a mais
                no app, e a próxima pode ser a sua.
              </p>
            </div>

            <CoursesList courses={courses} />

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
