import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import LandingFooter from "@/components/landing/landing-footer"
import GithubIcon from "@/components/landing/github-icon"
import { GITHUB_URL } from "@/components/landing/constants"
import { GithubStarCount, STAR_URL } from "@/components/landing/github-stars"
import { getCurrentOfferTerm } from "@/lib/offers"

export const metadata: Metadata = {
  title: "Por que o Extramatrícula existe",
  description:
    "A história por trás do Extramatrícula: um app open-source feito por um estudante para tornar a matrícula na UFMG menos dolorosa.",
}

// Roughly how many students planned their semester in the current cycle. Update per cycle.
const USERS_THIS_CYCLE = 361

export default function PorquePage() {
  const cycle = getCurrentOfferTerm()

  return (
    <div className="flex flex-col">
      <article className="mx-auto w-full max-w-2xl px-4 pt-12 pb-16 sm:pt-20">
        <p className="text-xs font-medium tracking-wide text-primary uppercase">
          Por quê?
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Fazer matrícula na UFMG é um porre
        </h1>

        <div className="mt-8 space-y-5 text-pretty text-muted-foreground [&_strong]:font-medium [&_strong]:text-foreground">
          <p>
            A interface é antiga, o site cai o tempo todo e montar uma grade de horários
            que não deixe lacunas é quase impossível. Some a isso a corrida por vagas e o
            medo de esbarrar num pré-requisito que você não sabia que faltava.
          </p>
          <p>
            Há 2 semestres eu perdi a paciência e construí um app pequeno para me ajudar.
            <strong> Vagas, pré-requisitos e preview da grade.</strong> Só isso.
          </p>
          <p>
            Mandei pra uns amigos e se espalhou rápido. Gente que eu nem conhecia pedindo
            função nova na minha DM. No semestre seguinte eu repeti a dose, melhorei o app
            e em 2 dias já tinham <strong>85 usuários novos</strong> na base e{" "}
            <strong>5 mil aulas simuladas</strong>.
          </p>
          <p>
            O <strong>Extramatrícula</strong> nasceu dessa ideia simples: você não deveria
            precisar descobrir sua grade na hora do desespero, com o sistema travando e o
            relógio correndo. Dá pra planejar tudo antes, com calma.
          </p>

          <div className="mt-8 w-fit -rotate-1 rounded-xl border bg-card p-4 shadow-md mx-auto">
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Ciclo de matrícula {cycle}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-600 dark:text-green-400">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-green-500" />
                </span>
                Ao vivo
              </span>
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
              {USERS_THIS_CYCLE.toLocaleString("pt-BR")}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                usuários neste ciclo
              </span>
            </p>
          </div>

          <h2 className="pt-4 text-xl font-semibold tracking-tight text-foreground">
            O que ele resolve
          </h2>
          <p>
            <strong>Economize tempo.</strong> Monte a grade inteira antes da matrícula
            abrir. Na hora, é só confirmar as turmas que você já escolheu, sem improviso.
          </p>
          <p>
            <strong>Evite dor de cabeça com o site caindo.</strong> Você faz todo o
            planejamento aqui. Quando o sistema da UFMG travar, você já sabe exatamente o
            que clicar e não perde a vaga por causa de um carregamento eterno.
          </p>
          <p>
            <strong>Chega de grade com conflito.</strong> Sua semana aparece num
            calendário visual, e turmas que batem de horário ficam óbvias na hora. Nada de
            planilha ou tentativa e erro.
          </p>
          <p>
            <strong>Sem surpresa com pré-requisitos.</strong> O fluxograma mostra o que
            está bloqueado e o que falta liberar, para você não descobrir na tela de
            matrícula que não pode cursar aquela disciplina.
          </p>

          <h2 className="pt-4 text-xl font-semibold tracking-tight text-foreground">
            Gratuito e open-source
          </h2>
          <p>
            O uso é 100% gratuito e não precisa de login. O código é aberto no GitHub, se
            você quiser sugerir uma função, corrigir um dado ou trazer a grade do seu
            curso, é só{" "}
            <a
              href={`${GITHUB_URL}/issues`}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-foreground underline underline-offset-4"
            >
              abrir uma issue
            </a>
            .
          </p>
          <p>
            Se você é um dos milhares de alunos que precisam se matricular nos próximos
            dias, espero que ele te ajude tanto quanto ajudou a mim.
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-2 sm:flex-row">
          <Button size="lg" className="w-full sm:w-auto" asChild>
            <Link href="/simulation">
              Simular meu semestre
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
            <a href={STAR_URL} target="_blank" rel="noreferrer">
              <GithubIcon className="size-4" />
              Ver no GitHub
              <GithubStarCount className="text-xs text-muted-foreground" />
            </a>
          </Button>
        </div>
      </article>

      <LandingFooter />
    </div>
  )
}
