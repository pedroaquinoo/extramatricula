import { getClassesWithPrerequisites, getCreditsByCode, isLocked } from "@/lib/curriculum"
import { getCurrentOfferForProgram } from "@/lib/offers"
import type { AvailableClass } from "@/hooks/use-available-classes"
import type { SharePick } from "@/lib/share"

// Each credit maps to 15h of class time in the semester — same convention the planner uses.
const HOURS_PER_CREDIT = 15

// Disciplines that are never scheduled by magic mode: they are project/internship shells with
// no fixed weekly slots and no point auto-planning. Matched against the discipline name.
export const AUTO_EXCLUDE_PATTERN = /projeto final de curso|monografia|est[aá]gio/i

// Keeps the search bounded and synchronous even for the "all pending" scope on large programs.
const MAX_CANDIDATES = 16
const MAX_NODES = 200_000
const MAX_RESULTS = 6

export type MagicScope = "current" | "all"

// How to rank the (already fill-to-target, conflict-free) schedules against each other.
export type MagicStrategy = "fewestDays" | "leastIdle" | "balanced"

export interface MagicConfig {
  scope: MagicScope
  strategy: MagicStrategy
  targetHours: number
  essentialCode: string
  excludedCodes: string[]
  // Allowed class window as "HH:MM". Turmas with any class starting before `earliestStart` or
  // ending after `latestEnd` are dropped. Empty strings mean no bound on that side.
  earliestStart: string
  latestEnd: string
}

export interface MagicSchedule {
  picks: SharePick[]
  codes: string[]
  disciplineCount: number
  hours: number
  days: number
  idleMinutes: number
  // Variance of daily class minutes across the week — lower means more evenly spread.
  balanceScore: number
}

// Weekdays the offer uses, in order. Balance is measured across all five so that concentrating
// everything into fewer days scores worse than spreading it out.
const WEEKDAYS = ["Segunda", "Terca", "Quarta", "Quinta", "Sexta"]

const strategyComparators: Record<
  MagicStrategy,
  (a: MagicSchedule, b: MagicSchedule) => number
> = {
  fewestDays: (a, b) =>
    a.days - b.days ||
    a.idleMinutes - b.idleMinutes ||
    b.hours - a.hours ||
    a.disciplineCount - b.disciplineCount,
  leastIdle: (a, b) =>
    a.idleMinutes - b.idleMinutes ||
    a.days - b.days ||
    b.hours - a.hours ||
    a.disciplineCount - b.disciplineCount,
  balanced: (a, b) =>
    a.balanceScore - b.balanceScore ||
    a.idleMinutes - b.idleMinutes ||
    b.hours - a.hours ||
    a.disciplineCount - b.disciplineCount,
}

export type MagicResult =
  { schedules: MagicSchedule[]; truncated: boolean } | { error: string }

interface Interval {
  day: string
  start: number
  end: number
}

interface Combo {
  turmas: AvailableClass[]
  intervals: Interval[]
  credits: number
}

interface Candidate {
  code: string
  name: string
  refPeriod: number
  combos: Combo[]
  isEssential: boolean
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

function overlaps(a: Interval, b: Interval): boolean {
  return a.day === b.day && a.start < b.end && a.end > b.start
}

function intervalsOf(turmas: AvailableClass[]): Interval[] {
  const intervals: Interval[] = []
  for (const turma of turmas) {
    for (const time of turma.times) {
      intervals.push({
        day: time.day,
        start: timeToMinutes(time.start),
        end: timeToMinutes(time.end),
      })
    }
  }
  return intervals
}

function hasInternalConflict(intervals: Interval[]): boolean {
  for (let i = 0; i < intervals.length; i++) {
    for (let j = i + 1; j < intervals.length; j++) {
      if (overlaps(intervals[i], intervals[j])) return true
    }
  }
  return false
}

// A discipline keeps at most one lecture (non-P) + one lab (P-prefixed) section, mirroring the
// planner's addClass rule. Each combo is one bookable choice for the discipline.
function buildCombos(
  turmas: AvailableClass[],
  credits: number,
  minStartMinutes: number,
  maxEndMinutes: number,
): Combo[] {
  const labs = turmas.filter((t) => t.availabilityCode.startsWith("P"))
  const lectures = turmas.filter((t) => !t.availabilityCode.startsWith("P"))

  const groups: AvailableClass[][] =
    lectures.length > 0 && labs.length > 0
      ? lectures.flatMap((lecture) => labs.map((lab) => [lecture, lab]))
      : turmas.map((turma) => [turma])

  const combos: Combo[] = []
  for (const group of groups) {
    const intervals = intervalsOf(group)
    if (hasInternalConflict(intervals)) continue
    // Honour the allowed daily window: drop combos with a class outside [start, end].
    if (intervals.some((iv) => iv.start < minStartMinutes || iv.end > maxEndMinutes))
      continue
    combos.push({ turmas: group, intervals, credits })
  }
  return combos
}

function buildCandidates(
  courseId: string,
  semester: number,
  passedSet: Set<string>,
  config: MagicConfig,
): { candidates: Candidate[] } | { error: string } {
  const excludedSet = new Set(config.excludedCodes)
  const minStartMinutes = config.earliestStart ? timeToMinutes(config.earliestStart) : 0
  const maxEndMinutes = config.latestEnd
    ? timeToMinutes(config.latestEnd)
    : Number.POSITIVE_INFINITY
  const offer = getCurrentOfferForProgram(courseId)

  const turmasByCode = new Map<string, AvailableClass[]>()
  for (const turma of offer) {
    const list = turmasByCode.get(turma.course_id) ?? []
    list.push(turma)
    turmasByCode.set(turma.course_id, list)
  }

  const classes = getClassesWithPrerequisites(courseId)
  const candidates: Candidate[] = []
  let essentialFound = false

  for (const cls of classes) {
    if (passedSet.has(cls.code)) continue

    const isEssential = cls.code === config.essentialCode

    // A discipline is only ever suggested once all its prerequisites are already passed — this
    // holds for the essential too, so we never build a schedule around a locked class.
    if (isLocked(cls.code, courseId, passedSet)) {
      if (isEssential) {
        return { error: "A disciplina essencial ainda tem pré-requisitos pendentes." }
      }
      continue
    }

    if (!isEssential) {
      if (excludedSet.has(cls.code)) continue
      if (AUTO_EXCLUDE_PATTERN.test(cls.name)) continue
      if (config.scope === "current" && cls.ref_period !== semester) continue
    }

    const turmas = turmasByCode.get(cls.code)
    if (!turmas || turmas.length === 0) {
      if (isEssential) {
        return { error: "A disciplina essencial não tem turma na oferta atual." }
      }
      continue
    }

    const combos = buildCombos(
      turmas,
      getCreditsByCode(cls.code),
      minStartMinutes,
      maxEndMinutes,
    )
    if (combos.length === 0) {
      if (isEssential) {
        return {
          error:
            "Nenhuma turma da disciplina essencial cabe nos filtros (faixa de horário ou conflito interno).",
        }
      }
      continue
    }

    if (isEssential) essentialFound = true
    candidates.push({
      code: cls.code,
      name: cls.name,
      refPeriod: cls.ref_period,
      combos,
      isEssential,
    })
  }

  if (config.essentialCode && !essentialFound) {
    if (passedSet.has(config.essentialCode)) {
      return { error: "A disciplina essencial já foi cursada." }
    }
    if (isLocked(config.essentialCode, courseId, passedSet)) {
      return { error: "A disciplina essencial ainda tem pré-requisitos pendentes." }
    }
    return { error: "A disciplina essencial não está disponível." }
  }

  // Essential first, then earliest periods (most overdue), then heaviest disciplines. The cap
  // keeps essential (index 0) and the earliest remaining candidates.
  candidates.sort((a, b) => {
    if (a.isEssential !== b.isEssential) return a.isEssential ? -1 : 1
    if (a.refPeriod !== b.refPeriod) return a.refPeriod - b.refPeriod
    return b.combos[0].credits - a.combos[0].credits
  })

  return { candidates: candidates.slice(0, MAX_CANDIDATES) }
}

function scoreIntervals(intervals: Interval[]): {
  days: number
  idleMinutes: number
  balanceScore: number
} {
  const byDay = new Map<string, Interval[]>()
  for (const iv of intervals) {
    const list = byDay.get(iv.day) ?? []
    list.push(iv)
    byDay.set(iv.day, list)
  }

  let idleMinutes = 0
  const busyByDay = new Map<string, number>()
  for (const [day, list] of byDay) {
    const first = Math.min(...list.map((iv) => iv.start))
    const last = Math.max(...list.map((iv) => iv.end))
    const busy = list.reduce((sum, iv) => sum + (iv.end - iv.start), 0)
    idleMinutes += last - first - busy
    busyByDay.set(day, busy)
  }

  // Balance = variance of busy minutes across every weekday (unused days count as 0), so packing
  // everything into a few days scores high and a spread-out week scores near zero.
  const dayKeys = new Set<string>([...WEEKDAYS, ...busyByDay.keys()])
  const loads = [...dayKeys].map((day) => busyByDay.get(day) ?? 0)
  const mean = loads.reduce((sum, v) => sum + v, 0) / loads.length
  const balanceScore = loads.reduce((sum, v) => sum + (v - mean) ** 2, 0) / loads.length

  return { days: byDay.size, idleMinutes, balanceScore }
}

export function computeMagicSchedules(
  courseId: string,
  semester: number,
  passedSet: Set<string>,
  config: MagicConfig,
): MagicResult {
  if (!config.essentialCode) {
    return { error: "Escolha uma disciplina essencial para começar." }
  }

  const built = buildCandidates(courseId, semester, passedSet, config)
  if ("error" in built) return built
  const { candidates } = built

  const budgetCredits = Math.max(0, Math.round(config.targetHours / HOURS_PER_CREDIT))

  const chosen: Combo[] = []
  const occupied: Interval[] = []
  const solutions = new Map<string, MagicSchedule>()
  let nodes = 0
  let truncated = false

  const conflicts = (combo: Combo): boolean =>
    combo.intervals.some((iv) => occupied.some((o) => overlaps(iv, o)))

  // The essential discipline is mandatory, so it ignores the credit budget: a target smaller
  // than it still yields a valid (single-discipline) schedule instead of nothing.
  const canAdd = (combo: Combo, credits: number, isEssential: boolean): boolean =>
    !conflicts(combo) && (isEssential || credits + combo.credits <= budgetCredits)

  const anyExtendable = (from: number, credits: number): boolean => {
    for (let i = from; i < candidates.length; i++) {
      const { combos, isEssential } = candidates[i]
      if (combos.some((combo) => canAdd(combo, credits, isEssential))) return true
    }
    return false
  }

  // A leaf is only worth keeping when *no* candidate (including ones skipped earlier) can still
  // be added — otherwise a fuller schedule exists on another branch. `anyExtendable` alone only
  // looks at the suffix, so skipping everything would wrongly look maximal.
  const isGloballyMaximal = (credits: number): boolean => {
    const chosenCodes = new Set(chosen.map((combo) => combo.turmas[0].course_id))
    for (const cand of candidates) {
      if (chosenCodes.has(cand.code)) continue
      if (cand.combos.some((combo) => canAdd(combo, credits, cand.isEssential)))
        return false
    }
    return true
  }

  const record = (credits: number) => {
    const turmas = chosen.flatMap((combo) => combo.turmas)
    const picks: SharePick[] = turmas.map((t) => ({
      course_id: t.course_id,
      availabilityCode: t.availabilityCode,
    }))
    const signature = picks
      .map((p) => `${p.course_id}:${p.availabilityCode}`)
      .sort()
      .join("|")
    if (solutions.has(signature)) return

    const { days, idleMinutes, balanceScore } = scoreIntervals(occupied)
    const codes = [...new Set(turmas.map((t) => t.course_id))]
    solutions.set(signature, {
      picks,
      codes,
      disciplineCount: codes.length,
      hours: credits * HOURS_PER_CREDIT,
      days,
      idleMinutes,
      balanceScore,
    })
  }

  const dfs = (index: number, credits: number) => {
    if (truncated) return
    if (++nodes > MAX_NODES) {
      truncated = true
      return
    }

    // A maximal schedule can't take any more candidate without breaking budget or clashing —
    // that is what "fill up to target" means.
    if (!anyExtendable(index, credits)) {
      if (chosen.length > 0 && isGloballyMaximal(credits)) record(credits)
      return
    }

    if (index >= candidates.length) return

    const candidate = candidates[index]

    for (const combo of candidate.combos) {
      if (!canAdd(combo, credits, candidate.isEssential)) continue
      chosen.push(combo)
      occupied.push(...combo.intervals)
      dfs(index + 1, credits + combo.credits)
      occupied.length -= combo.intervals.length
      chosen.pop()
      if (truncated) return
    }

    // Skipping is only allowed for non-essential disciplines; the essential one is mandatory.
    if (!candidate.isEssential) {
      dfs(index + 1, credits)
    }
  }

  dfs(0, 0)

  const ranked = [...solutions.values()].sort(strategyComparators[config.strategy])

  // Prefer showing genuinely different schedules (distinct discipline sets) over three variants
  // of the same disciplines that differ only by turma; fall back to the next-best variants only
  // if there aren't enough distinct sets to fill the three slots.
  const schedules: MagicSchedule[] = []
  const seenSets = new Set<string>()
  for (const schedule of ranked) {
    if (schedules.length >= MAX_RESULTS) break
    const key = [...schedule.codes].sort().join(",")
    if (seenSets.has(key)) continue
    seenSets.add(key)
    schedules.push(schedule)
  }
  for (const schedule of ranked) {
    if (schedules.length >= MAX_RESULTS) break
    if (!schedules.includes(schedule)) schedules.push(schedule)
  }

  return { schedules, truncated }
}
