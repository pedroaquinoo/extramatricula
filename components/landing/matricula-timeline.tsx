"use client"

import { useEffect, useState } from "react"
import { Smartphone, Globe, Flag, CalendarClock } from "lucide-react"

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
 * de dia. Para o próximo semestre, basta atualizar `steps` e `TERM`.
 *
 * 1ª Fase, 2º período letivo de 2026: requerimento de 13 a 15 de julho.
 * App SiGAUFMG a partir de 13/07; SiGA na Web a partir de 14/07.
 */
const TERM = "1ª Fase · 2026/2"

type Step = {
  /** Data do evento, no formato YYYY-MM-DD (fuso de Brasília). */
  date: string
  icon: typeof Smartphone
  title: string
  /** Rótulo curto usado na contagem regressiva. */
  short: string
}

const steps: Step[] = [
  {
    date: "2026-07-13",
    icon: Smartphone,
    title: "Requerimento abre no app SiGAUFMG",
    short: "Requerimento no app",
  },
  { date: "2026-07-14", icon: Globe, title: "SiGA na Web abre", short: "SiGA na Web" },
  {
    date: "2026-07-15",
    icon: Flag,
    title: "Último dia do requerimento",
    short: "Prazo final",
  },
]

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
  const months = [
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
  return `${d} ${months[m - 1]}`
}

function countdownLabel(days: number) {
  if (days === 0) return "hoje"
  if (days === 1) return "amanhã"
  return `em ${days} dias`
}

function TimelineList({ today, next }: { today: string | null; next: Step | null }) {
  return (
    <ol className="grid gap-2">
      {steps.map((step) => {
        const days = today === null ? null : daysUntil(step.date, today)
        const isPast = days !== null && days < 0
        const isNext = next?.date === step.date

        return (
          <li
            key={step.date}
            className={cn(
              "flex items-start gap-3 rounded-lg border bg-card p-3",
              isPast && "opacity-50",
              isNext && !isPast && "border-primary/50 bg-primary/5",
            )}
          >
            <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <step.icon className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium tabular-nums text-muted-foreground">
                {formatDay(step.date)}
                {isNext && !isPast && " · a seguir"}
              </p>
              <p className="mt-0.5 text-sm font-medium text-balance">{step.title}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export default function MatriculaTimeline() {
  const [open, setOpen] = useState(false)
  const isDesktop = useIsDesktop()

  // Renderiza a data só após montar para evitar divergência de hidratação.
  const [today, setToday] = useState<string | null>(null)
  useEffect(() => setToday(saoPauloToday()), [])

  const lastDate = steps[steps.length - 1].date
  const isOver = today !== null && daysUntil(lastDate, today) < 0
  const next =
    today === null ? null : steps.find((s) => daysUntil(s.date, today) >= 0) ?? null

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
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{status}</DialogDescription>
          </DialogHeader>
          <TimelineList today={today} next={next} />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{status}</DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-6">
          <TimelineList today={today} next={next} />
        </div>
      </DrawerContent>
    </Drawer>
  )
}
