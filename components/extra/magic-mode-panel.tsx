"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Sparkles,
  CalendarDays,
  Clock,
  Check,
  Loader2,
  ChevronDown,
  ArrowLeft,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useAvailableClasses } from "@/hooks/use-available-classes"
import { useCourseData } from "@/hooks/use-course-data"
import { useAppStore } from "@/lib/store"
import { isLocked } from "@/lib/curriculum"
import {
  AUTO_EXCLUDE_PATTERN,
  computeMagicSchedules,
  type MagicSchedule,
  type MagicScope,
  type MagicStrategy,
} from "@/lib/magic-mode"
import { captureEvent } from "@/lib/analytics"
import { AnalyticsEvents } from "@/lib/analytics-events"
import { cn } from "@/lib/utils"

const HOURS_PER_CREDIT = 15
const MIN_HOURS = 120
const MAX_HOURS = 450
const HOURS_STEP = 30
const DEFAULT_EARLIEST = "07:00"
const DEFAULT_LATEST = "23:00"

// Selectable hours of the day for the class-window filter (07:00 … 23:00).
const DAY_HOURS = Array.from(
  { length: 17 },
  (_, i) => `${String(7 + i).padStart(2, "0")}:00`,
)

const STRATEGIES: {
  value: MagicStrategy
  label: string
  description: string
}[] = [
  {
    value: "fewestDays",
    label: "Menos dias na UFMG",
    description: "Concentra as aulas no menor número de dias.",
  },
  {
    value: "leastIdle",
    label: "Menos lacunas entre aulas",
    description: "Dias mais compactos, com menos tempo vago no campus.",
  },
  {
    value: "balanced",
    label: "Semana equilibrada",
    description: "Distribui as aulas de forma mais uniforme pela semana.",
  },
]

const controlClassName = cn(
  "flex h-11 w-full appearance-none rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
)

// Clamp into the opinionated range and snap to the slider's 30h step.
function snapHours(hours: number): number {
  const clamped = Math.min(MAX_HOURS, Math.max(MIN_HOURS, hours))
  return Math.round(clamped / HOURS_STEP) * HOURS_STEP
}

function formatIdle(minutes: number): string {
  if (minutes <= 0) return "sem lacunas"
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  const time =
    hours === 0 ? `${mins}min` : mins === 0 ? `${hours}h` : `${hours}h${mins}min`
  return `lacunas de ${time}`
}

type Step = "config" | "results"

export function MagicModePanel({
  onApply,
}: {
  // Load the chosen schedule into the live weekly planner. Returns nothing; the panel keeps its
  // results visible so the student can try another option.
  onApply: (schedule: MagicSchedule) => void | Promise<void>
}) {
  const { courseId, classes, passedSet } = useCourseData()
  const { semester } = useAppStore()
  const { availableClasses } = useAvailableClasses()

  const [step, setStep] = useState<Step>("config")
  const [scope, setScope] = useState<MagicScope>("current")
  const [strategy, setStrategy] = useState<MagicStrategy>("fewestDays")
  const [targetHours, setTargetHours] = useState(240)
  const [earliestStart, setEarliestStart] = useState(DEFAULT_EARLIEST)
  const [latestEnd, setLatestEnd] = useState(DEFAULT_LATEST)
  const [essentialCode, setEssentialCode] = useState("")
  const [excludedCodes, setExcludedCodes] = useState<string[]>([])
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<MagicSchedule[] | null>(null)
  const [truncated, setTruncated] = useState(false)
  const [appliedSignature, setAppliedSignature] = useState<string | null>(null)

  // Disciplines the student can actually enroll in now: not yet passed, unlocked, and offered
  // this term. These feed both the essential picker and the exclusion list.
  const eligible = useMemo(() => {
    if (!courseId) return []
    const offered = new Set(availableClasses.map((cls) => cls.course_id))
    return classes
      .filter(
        (cls) =>
          !passedSet.has(cls.code) &&
          offered.has(cls.code) &&
          !isLocked(cls.code, courseId, passedSet),
      )
      .sort((a, b) => a.ref_period - b.ref_period || a.code.localeCompare(b.code))
  }, [classes, courseId, passedSet, availableClasses])

  const defaultTargetHours = useMemo(() => {
    const credits = classes
      .filter((cls) => cls.ref_period === semester)
      .reduce((sum, cls) => sum + cls.credits, 0)
    return credits * HOURS_PER_CREDIT
  }, [classes, semester])

  const autoExcluded = useMemo(
    () =>
      eligible
        .filter((cls) => AUTO_EXCLUDE_PATTERN.test(cls.name))
        .map((cls) => cls.code),
    [eligible],
  )

  // Seed sensible defaults once the eligible list is known (and re-seed if the underlying data
  // changes while the panel is mounted).
  useEffect(() => {
    setTargetHours(snapHours(defaultTargetHours || 240))
    setExcludedCodes(autoExcluded)
    setEssentialCode((prev) =>
      prev && eligible.some((cls) => cls.code === prev)
        ? prev
        : (eligible[0]?.code ?? ""),
    )
  }, [defaultTargetHours, autoExcluded, eligible])

  const toggleExcluded = (code: string) =>
    setExcludedCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    )

  const run = () => {
    if (!courseId || !semester) return
    setStep("results")
    setRunning(true)
    setError(null)
    setResults(null)
    setTruncated(false)
    setAppliedSignature(null)
    captureEvent(AnalyticsEvents.MAGIC_MODE_RUN, {
      scope,
      strategy,
      target_hours: targetHours,
      earliest_start: earliestStart,
      latest_end: latestEnd,
      essential: essentialCode,
      excluded_count: excludedCodes.length,
    })
    // Let the "Calculando…" state paint before the synchronous solver blocks the thread.
    setTimeout(() => {
      try {
        const result = computeMagicSchedules(courseId, semester, passedSet, {
          scope,
          strategy,
          targetHours,
          earliestStart,
          latestEnd,
          essentialCode,
          excludedCodes,
        })
        if ("error" in result) {
          setError(result.error)
          captureEvent(AnalyticsEvents.MAGIC_MODE_RUN_COMPLETED, {
            scope,
            strategy,
            target_hours: targetHours,
            outcome: "error",
            result_count: 0,
            truncated: false,
          })
        } else {
          setResults(result.schedules)
          setTruncated(result.truncated)
          captureEvent(AnalyticsEvents.MAGIC_MODE_RUN_COMPLETED, {
            scope,
            strategy,
            target_hours: targetHours,
            outcome: result.schedules.length === 0 ? "empty" : "success",
            result_count: result.schedules.length,
            truncated: result.truncated,
          })
        }
      } catch {
        setError("Não foi possível calcular as grades. Tente novamente.")
        captureEvent(AnalyticsEvents.MAGIC_MODE_RUN_COMPLETED, {
          scope,
          strategy,
          target_hours: targetHours,
          outcome: "error",
          result_count: 0,
          truncated: false,
        })
      } finally {
        setRunning(false)
      }
    }, 0)
  }

  const signatureOf = (schedule: MagicSchedule) =>
    schedule.picks
      .map((p) => `${p.course_id}:${p.availabilityCode}`)
      .sort()
      .join("|")

  const applySchedule = (schedule: MagicSchedule, optionIndex: number) => {
    captureEvent(AnalyticsEvents.MAGIC_MODE_APPLIED, {
      strategy,
      scope,
      days: schedule.days,
      hours: schedule.hours,
      discipline_count: schedule.disciplineCount,
      option_index: optionIndex,
    })
    setAppliedSignature(signatureOf(schedule))
    onApply(schedule)
  }

  if (!courseId || !semester) return null

  const strategyLabel = STRATEGIES.find((s) => s.value === strategy)?.label

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-muted/20 p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="size-4.5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">Modo mágico</h2>
          <p className="text-xs text-pretty text-muted-foreground">
            Calculamos as melhores versões da sua grade a partir das suas preferências.
          </p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 text-xs font-medium">
        <button
          type="button"
          onClick={() => setStep("config")}
          disabled={step === "config"}
          aria-current={step === "config" ? "step" : undefined}
          className={cn(
            "flex items-center gap-1.5 rounded-md text-left transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
            step === "config" ? "text-foreground" : "text-muted-foreground",
            step === "results" && "hover:text-foreground",
          )}
        >
          <span
            className={cn(
              "flex size-5 items-center justify-center rounded-full border text-[11px]",
              step === "config"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-muted-foreground/40",
            )}
          >
            1
          </span>
          Configurar
        </button>
        <span className="h-px flex-1 bg-border" />
        <span
          className={cn(
            "flex items-center gap-1.5",
            step === "results" ? "text-foreground" : "text-muted-foreground",
          )}
        >
          <span
            className={cn(
              "flex size-5 items-center justify-center rounded-full border text-[11px]",
              step === "results"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-muted-foreground/40",
            )}
          >
            2
          </span>
          Resultados
        </span>
      </div>

      {step === "config" ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Disciplinas a considerar</span>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  {
                    value: "current",
                    label: "Período atual",
                    description: "Só as disciplinas sugeridas para o seu período.",
                  },
                  {
                    value: "all",
                    label: "Todas as pendentes",
                    description: "Inclui disciplinas atrasadas de períodos anteriores.",
                  },
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setScope(option.value)}
                  className={cn(
                    "flex flex-col gap-0.5 rounded-lg border px-3 py-2.5 text-left transition-colors",
                    scope === option.value
                      ? "border-primary bg-primary/[0.06] text-foreground"
                      : "bg-muted/30 hover:bg-muted/50",
                  )}
                >
                  <span className="text-sm font-medium">{option.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {option.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Otimizar para</span>
            <div className="grid gap-2">
              {STRATEGIES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStrategy(option.value)}
                  className={cn(
                    "flex flex-col gap-0.5 rounded-lg border px-3 py-2.5 text-left transition-colors",
                    strategy === option.value
                      ? "border-primary bg-primary/[0.06]"
                      : "bg-muted/30 hover:bg-muted/50",
                  )}
                >
                  <span className="text-sm font-medium">{option.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {option.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-medium">Carga horária do semestre</span>
              <span className="text-sm tabular-nums text-muted-foreground">
                {targetHours}h · ≈ {Math.round(targetHours / HOURS_PER_CREDIT / 4)}{" "}
                disciplinas
              </span>
            </div>
            <Slider
              min={MIN_HOURS}
              max={MAX_HOURS}
              step={HOURS_STEP}
              value={[targetHours]}
              onValueChange={(value) => setTargetHours(value[0])}
              className="py-1"
            />
            <div className="flex justify-between text-xs tabular-nums text-muted-foreground">
              <span>{MIN_HOURS}h</span>
              <span>{MAX_HOURS}h</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Horário das aulas</span>
            <div className="flex items-center gap-2">
              <select
                value={earliestStart}
                onChange={(event) => setEarliestStart(event.target.value)}
                aria-label="Horário inicial"
                className={cn(controlClassName, "flex-1")}
              >
                {DAY_HOURS.filter((hour) => hour < latestEnd).map((hour) => (
                  <option key={hour} value={hour}>
                    {hour}
                  </option>
                ))}
              </select>
              <span className="text-sm text-muted-foreground">até</span>
              <select
                value={latestEnd}
                onChange={(event) => setLatestEnd(event.target.value)}
                aria-label="Horário final"
                className={cn(controlClassName, "flex-1")}
              >
                {DAY_HOURS.filter((hour) => hour > earliestStart).map((hour) => (
                  <option key={hour} value={hour}>
                    {hour}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-xs text-muted-foreground">
              Só entram turmas com aulas dentro dessa faixa de horário.
            </span>
          </div>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">Disciplina essencial</span>
            <select
              value={essentialCode}
              onChange={(event) => setEssentialCode(event.target.value)}
              className={controlClassName}
            >
              {eligible.length === 0 && (
                <option value="" disabled>
                  Nenhuma disciplina disponível
                </option>
              )}
              {eligible.map((cls) => (
                <option key={cls.code} value={cls.code}>
                  {cls.code} - {cls.name}
                </option>
              ))}
            </select>
            <span className="text-xs text-muted-foreground">
              A grade começa por ela e ela aparece em todas as opções.
            </span>
          </label>

          <Collapsible className="flex flex-col gap-2">
            <CollapsibleTrigger className="group flex items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-muted/50">
              <span>
                Disciplinas a excluir
                {excludedCodes.length > 0 && (
                  <span className="ml-1.5 tabular-nums text-muted-foreground">
                    · {excludedCodes.length}
                  </span>
                )}
              </span>
              <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="flex flex-col gap-2">
              <div className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-lg border p-2">
                {eligible
                  .filter((cls) => cls.code !== essentialCode)
                  .map((cls) => (
                    <label
                      key={cls.code}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={excludedCodes.includes(cls.code)}
                        onCheckedChange={() => toggleExcluded(cls.code)}
                      />
                      <span className="font-mono text-xs">{cls.code}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {cls.name}
                      </span>
                    </label>
                  ))}
              </div>
              <span className="text-xs text-muted-foreground">
                Monografia, estágio e projeto final já vêm marcados.
              </span>
            </CollapsibleContent>
          </Collapsible>

          <Button onClick={run} disabled={!essentialCode} className="w-full">
            <Sparkles className="size-4" />
            Executar
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <Button variant="outline" onClick={() => setStep("config")} className="w-full">
            <ArrowLeft className="size-4" />
            Voltar e ajustar
          </Button>

          {running && (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Calculando as melhores grades…
              </p>
            </div>
          )}

          {!running && error && (
            <p className="text-sm text-destructive text-pretty">{error}</p>
          )}

          {!running && results && results.length === 0 && !error && (
            <p className="text-sm text-muted-foreground text-pretty">
              Nenhuma grade viável encontrada. Tente aumentar a carga horária, adiantar o
              horário mínimo ou remover exclusões.
            </p>
          )}

          {!running && results && results.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">
                {results.length === 1
                  ? "Melhor grade encontrada"
                  : `${results.length} melhores grades`}
                <span className="ml-1.5 font-normal text-muted-foreground">
                  · {strategyLabel?.toLowerCase()}
                </span>
              </span>
              {truncated && (
                <p className="text-xs text-muted-foreground">
                  Busca ampla: mostramos as melhores que encontramos.
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Toque numa opção para carregá-la na sua semana.
              </p>
              <div className="grid grid-cols-1 gap-2">
                {results.map((schedule, index) => {
                  const applied = appliedSignature === signatureOf(schedule)
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => applySchedule(schedule, index)}
                      className={cn(
                        "group flex flex-col gap-2 rounded-lg border p-3 text-left transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
                        applied
                          ? "border-primary bg-primary/[0.06]"
                          : "hover:border-primary hover:bg-primary/[0.04]",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">Opção {index + 1}</span>
                        {applied && (
                          <span className="flex items-center gap-1 text-xs font-medium text-primary">
                            <Check className="size-3.5" />
                            Na sua semana
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="size-3.5" />
                          {schedule.days} {schedule.days === 1 ? "dia" : "dias"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="size-3.5" />
                          {formatIdle(schedule.idleMinutes)}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {schedule.codes.map((code) => (
                          <span
                            key={code}
                            className="rounded border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                          >
                            {code}
                          </span>
                        ))}
                      </div>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {schedule.hours}h · {schedule.disciplineCount}{" "}
                        {schedule.disciplineCount === 1 ? "disciplina" : "disciplinas"}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
