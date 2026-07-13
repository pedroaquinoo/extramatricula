"use client"

import { useEffect, useState } from "react"
import {
  Smartphone,
  Globe,
  Flag,
  ListPlus,
  GraduationCap,
  Layers,
  Award,
  CalendarClock,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { useIsDesktop } from "@/hooks/use-media-query"

/**
 * Cronograma da matrícula. Datas no fuso de Brasília (UTC−3), tratadas a nível
 * de dia. Para o próximo semestre, basta atualizar `schedule` e `TERM`.
 *
 * 2º período letivo de 2026:
 *  1ª Fase — requerimento de matrícula (app SiGAUFMG 13/07, SiGA na Web 14/07,
 *            prazo final 15/07).
 *  2ª Fase — inclusão de novas atividades (núcleo específico), 27–28/07.
 *  Início do período letivo em 03/08.
 *  3ª Fase — AACs dos núcleos geral e complementar, 03–04/08.
 *  4ª Fase — AACs de pós-graduação (núcleo avançado), 10/08.
 */
const TERM = "2026/2"

const MONTHS = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
]

type Step = {
  /** Início do evento, no formato YYYY-MM-DD (fuso de Brasília). */
  date: string
  /** Fim do evento, quando ele abrange mais de um dia. */
  end?: string
  icon: typeof Smartphone
  title: string
  /** Rótulo curto usado na contagem regressiva. */
  short: string
}

/** Um bloco do cronograma: uma fase com vários eventos ou um marco isolado. */
type Block =
  | { kind: "phase"; label: string; note: string; steps: Step[] }
  | { kind: "milestone"; step: Step }

const schedule: Block[] = [
  {
    kind: "phase",
    label: "1ª Fase",
    note: "Requerimento de matrícula",
    steps: [
      {
        date: "2026-07-13",
        icon: Smartphone,
        title: "Requerimento abre no app SiGAUFMG",
        short: "Requerimento no app",
      },
      {
        date: "2026-07-14",
        icon: Globe,
        title: "SiGA na Web abre",
        short: "SiGA na Web",
      },
      {
        date: "2026-07-15",
        icon: Flag,
        title: "Último dia do requerimento",
        short: "Prazo final",
      },
    ],
  },
  {
    kind: "phase",
    label: "2ª Fase",
    note: "Inclusão de atividades",
    steps: [
      {
        date: "2026-07-27",
        end: "2026-07-28",
        icon: ListPlus,
        title: "Inclusão de novas atividades (núcleo específico) em turmas com vagas",
        short: "2ª Fase",
      },
    ],
  },
  {
    kind: "milestone",
    step: {
      date: "2026-08-03",
      icon: GraduationCap,
      title: "Início do 2º período letivo de 2026",
      short: "Início das aulas",
    },
  },
  {
    kind: "phase",
    label: "3ª Fase",
    note: "AACs dos núcleos geral e complementar",
    steps: [
      {
        date: "2026-08-03",
        end: "2026-08-04",
        icon: Layers,
        title:
          "AACs do núcleo geral (formação livre) e do núcleo complementar (formação complementar aberta e transversais)",
        short: "3ª Fase",
      },
    ],
  },
  {
    kind: "phase",
    label: "4ª Fase",
    note: "AACs de pós-graduação",
    steps: [
      {
        date: "2026-08-10",
        icon: Award,
        title:
          "AACs de pós-graduação (núcleo avançado) para estudantes de graduação em colegiados de pós",
        short: "4ª Fase",
      },
    ],
  },
]

/** Todos os eventos em ordem cronológica, para a contagem regressiva. */
const allSteps: Step[] = schedule.flatMap((b) =>
  b.kind === "phase" ? b.steps : [b.step],
)

/** Dias de hoje até a data-alvo (negativo = passado, 0 = hoje). */
function daysUntil(target: string, today: string) {
  const toUTC = (d: string) => {
    const [y, m, day] = d.split("-").map(Number)
    return Date.UTC(y, m - 1, day)
  }
  return Math.round((toUTC(target) - toUTC(today)) / 86_400_000)
}

/** Data de hoje (YYYY-MM-DD) no fuso de Brasília, independente do fuso do dispositivo. */
function saoPauloToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

function formatDay(date: string) {
  const [, m, d] = date.split("-").map(Number)
  return `${d} ${MONTHS[m - 1]}`
}

function formatRange(start: string, end?: string) {
  if (!end || end === start) return formatDay(start)
  const [, m1, d1] = start.split("-").map(Number)
  const [, m2, d2] = end.split("-").map(Number)
  if (m1 === m2) return `${d1}–${d2} ${MONTHS[m2 - 1]}`
  return `${formatDay(start)} – ${formatDay(end)}`
}

/** Último dia relevante do evento (fim do intervalo, ou o próprio dia). */
function stepEnd(step: Step) {
  return step.end ?? step.date
}

function countdownLabel(days: number) {
  if (days < 0) return "em andamento"
  if (days === 0) return "hoje"
  if (days === 1) return "amanhã"
  return `em ${days} dias`
}

function StepRow({
  step,
  today,
  next,
}: {
  step: Step
  today: string | null
  next: Step | null
}) {
  const isPast = today !== null && daysUntil(stepEnd(step), today) < 0
  const isNext = next === step

  return (
    <li
      className={cn(
        "flex items-start gap-2.5 rounded-md border bg-card px-2.5 py-2",
        isPast && "opacity-50",
        isNext && !isPast && "border-primary/50 bg-primary/5",
      )}
    >
      <step.icon className="mt-0.5 size-3.5 shrink-0 text-primary" />
      <div className="min-w-0">
        <p className="text-sm leading-snug font-medium text-balance">{step.title}</p>
        <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
          {formatRange(step.date, step.end)}
          {isNext && !isPast && " · a seguir"}
        </p>
      </div>
    </li>
  )
}

function Timeline({ today, next }: { today: string | null; next: Step | null }) {
  return (
    <div className="space-y-3">
      {schedule.map((block, i) => {
        if (block.kind === "milestone") {
          const step = block.step
          const isPast = today !== null && daysUntil(stepEnd(step), today) < 0
          return (
            <div
              key={`milestone-${i}`}
              className={cn(
                "flex items-center gap-2 rounded-md bg-muted/60 px-2.5 py-1.5",
                isPast && "opacity-50",
              )}
            >
              <step.icon className="size-3.5 shrink-0 text-primary" />
              <span className="text-xs font-medium text-balance">{step.title}</span>
              <span className="ml-auto shrink-0 text-xs tabular-nums text-muted-foreground">
                {formatDay(step.date)}
              </span>
            </div>
          )
        }

        const start = block.steps[0].date
        const end = stepEnd(block.steps[block.steps.length - 1])
        const groupPast = today !== null && daysUntil(end, today) < 0
        const headingId = `fase-${i}`

        return (
          <section
            key={headingId}
            aria-labelledby={headingId}
            className={cn(groupPast && "opacity-60")}
          >
            <div className="flex items-baseline justify-between gap-3">
              <h3
                id={headingId}
                className="text-xs font-semibold tracking-wide uppercase text-muted-foreground"
              >
                {block.label}
              </h3>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {formatRange(start, end)}
              </span>
            </div>

            <ol className="mt-1.5 grid gap-1.5">
              {block.steps.map((step) => (
                <StepRow
                  key={`${step.date}-${step.title}`}
                  step={step}
                  today={groupPast ? null : today}
                  next={next}
                />
              ))}
            </ol>
          </section>
        )
      })}
    </div>
  )
}

export default function MatriculaTimeline() {
  const [open, setOpen] = useState(false)
  const isDesktop = useIsDesktop()

  // Renderiza a data só após montar para evitar divergência de hidratação.
  const [today, setToday] = useState<string | null>(null)
  useEffect(() => setToday(saoPauloToday()), [])

  // Abre automaticamente quando a URL aponta para #fases.
  useEffect(() => {
    const sync = () => {
      if (window.location.hash === "#fases") setOpen(true)
    }
    sync()
    window.addEventListener("hashchange", sync)
    return () => window.removeEventListener("hashchange", sync)
  }, [])

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    // Limpa o #fases ao fechar para que a URL não reabra o diálogo depois.
    if (!nextOpen && window.location.hash === "#fases") {
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search,
      )
    }
  }

  const lastStep = allSteps[allSteps.length - 1]
  const isOver = today !== null && daysUntil(stepEnd(lastStep), today) < 0
  const next =
    today === null
      ? null
      : (allSteps.find((s) => daysUntil(stepEnd(s), today) >= 0) ?? null)

  const status =
    today === null
      ? "Cronograma do requerimento"
      : isOver
        ? "Requerimento encerrado"
        : next
          ? `${next.short} · ${countdownLabel(daysUntil(next.date, today))}`
          : "Cronograma do requerimento"

  const title = `Matrícula · ${TERM}`

  const trigger = (
    <Button variant="outline" size="sm" aria-label="Cronograma da matrícula">
      <CalendarClock className="size-4" />
      <span className="hidden sm:inline">Matrícula</span>
    </Button>
  )

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{status}</DialogDescription>
          </DialogHeader>
          <Timeline today={today} next={next} />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{status}</DrawerDescription>
        </DrawerHeader>
        <div className="max-h-[65vh] overflow-y-auto px-4 pb-6">
          <Timeline today={today} next={next} />
        </div>
      </DrawerContent>
    </Drawer>
  )
}
