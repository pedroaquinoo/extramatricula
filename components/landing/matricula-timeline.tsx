"use client"

import { useEffect, useState } from "react"
import { Smartphone, Globe, Flag } from "lucide-react"

import { cn } from "@/lib/utils"

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

export default function MatriculaTimeline() {
  // Renderiza só após montar para evitar divergência de hidratação com a data.
  const [today, setToday] = useState<string | null>(null)
  useEffect(() => setToday(saoPauloToday()), [])

  const lastDate = steps[steps.length - 1].date
  const isOver = today !== null && daysUntil(lastDate, today) < 0
  const next =
    today === null ? null : steps.find((s) => daysUntil(s.date, today) >= 0) ?? null

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-lg font-semibold tracking-wide uppercase">
          Matrícula · {TERM}
        </p>
        {today !== null && (
          <p className="text-sm font-medium text-right text-balance">
            {isOver
              ? "Requerimento encerrado"
              : next
                ? `${next.short} · ${countdownLabel(daysUntil(next.date, today))}`
                : null}
          </p>
        )}
      </div>

      <ol className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-3">
        {steps.map((step) => {
          const days = today === null ? null : daysUntil(step.date, today)
          const isPast = days !== null && days < 0
          const isNext = next?.date === step.date

          return (
            <li
              key={step.date}
              className={cn("flex items-start bg-background gap-2.5 text-black p-4 rounded-lg", isPast && "opacity-45")}
            >
              <step.icon className="mt-0.5 size-4 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium tabular-nums opacity-70">
                  {formatDay(step.date)}
                  {isNext && !isPast && " · a seguir"}
                </p>
                <p className="mt-0.5 text-sm font-medium text-balance">{step.title}</p>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
