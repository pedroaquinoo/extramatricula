import { readFile } from "fs/promises"
import {
  extractContentStreams,
  extractFragments,
  extractRowSeparators,
  textOfColumn,
  type Fragment,
} from "./pdf-utils"

export interface ParsedCurriculumClass {
  ref_period: number
  code: string
  name: string
  description: null
  credits: number
  elective: false
}

export interface ParsedCurriculumPrerequisite {
  code: string
  prerequisite_code: string
}

export interface ParsedCurriculum {
  classes: ParsedCurriculumClass[]
  prerequisites: ParsedCurriculumPrerequisite[]
  courseName: string
  shift: "diurno" | "noturno"
}

const COLUMNS: Array<[number, number, string]> = [
  [20, 295, "atividade"],
  [295, 330, "creditos"],
  [560, 595, "natureza"],
  [630, 720, "prereq"],
]

const ACTIVITY_RE = /(?:[A-Z]{2,4}\s*-\s*)?([A-Z]{2,4}\d{3})\s*-\s*(.+)/i
const PREREQ_RE = /^[A-Z]{2,4}\d{3}$/
const OBRIG_NATURE = new Set(["OB", "EC"])

type SectionEvent =
  | { y: number; kind: "period"; period: number }
  | { y: number; kind: "obrig_start" }
  | { y: number; kind: "section_end" }

interface ParsedRow {
  period: number
  activity: string
  credits: string
  natureza: string
  prereqs: string[]
}

function columnOf(x: number): string | null {
  for (const [start, end, name] of COLUMNS) {
    if (x >= start - 2 && x < end) return name
  }
  return null
}

function classifyFragment(text: string): SectionEvent | null {
  const periodMatch = text.match(/^\s*(\d+)[ºo]\s*PER[IÍ]ODO/i)
  if (periodMatch) return { y: 0, kind: "period", period: Number(periodMatch[1]) }

  if (/Atividades acad[eê]micas obrigat[oó]rias no percurso/i.test(text)) {
    return { y: 0, kind: "obrig_start" }
  }

  if (/Carga hor[aá]ria adicional do per[ií]odo/i.test(text)) {
    return { y: 0, kind: "section_end" }
  }

  return null
}

function formatCourseName(raw: string): string {
  return formatClassName(raw)
}

function formatClassName(raw: string): string {
  const lowerParticles = new Set(["a", "e", "o", "de", "da", "do", "das", "dos", "em", "na", "no"])
  const romanNumeral = /^(i{1,3}|iv|v|vi{0,3}|ix|xi{0,3}|xii|xiii)$/i

  return raw
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) => {
      if (romanNumeral.test(word)) return word.toUpperCase()
      if (index > 0 && lowerParticles.has(word)) return word
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(" ")
}

function parsePrerequisites(cells: Map<string, Fragment[]>): string[] {
  const codes = new Set<string>()
  for (const raw of textOfColumn(cells, "prereq")) {
    for (const part of raw.split(/[,\s]+/)) {
      const code = part.trim().toUpperCase()
      if (PREREQ_RE.test(code)) codes.add(code)
    }
  }
  return [...codes]
}

function cellsForRow(frags: Fragment[], top: number, bottom: number): Map<string, Fragment[]> {
  const cells = new Map<string, Fragment[]>()
  for (const f of frags) {
    if (f.y >= bottom - 1 && f.y < top - 1) {
      const col = columnOf(f.x)
      if (!col) continue
      const list = cells.get(col)
      if (list) list.push(f)
      else cells.set(col, [f])
    }
  }
  return cells
}

function parseRowBand(
  frags: Fragment[],
  top: number,
  bottom: number,
  period: number,
): ParsedRow | null {
  const cells = cellsForRow(frags, top, bottom)
  const natureza = textOfColumn(cells, "natureza").join("").trim()
  const activity = textOfColumn(cells, "atividade").join(" ").trim()
  const credits = textOfColumn(cells, "creditos").join("").trim()

  if (!activity && !natureza) return null

  return {
    period,
    activity,
    credits,
    natureza,
    prereqs: parsePrerequisites(cells),
  }
}

function mergeMultilineRows(rows: ParsedRow[]): ParsedRow[] {
  const merged: ParsedRow[] = []
  let pendingActivity = ""

  for (const row of rows) {
    const hasNature = OBRIG_NATURE.has(row.natureza)
    const activityText = [pendingActivity, row.activity].filter(Boolean).join(" ").trim()

    if (!hasNature) {
      if (activityText) pendingActivity = activityText
      continue
    }

    merged.push({ ...row, activity: activityText })
    pendingActivity = ""
  }

  return merged
}

function extractMetadata(frags: Fragment[]): { courseName: string; shift: "diurno" | "noturno" } {
  let courseName = ""
  for (const f of frags) {
    if (f.x > 90 && f.x < 320 && f.y > 450 && f.y < 470 && f.text.trim()) {
      courseName = f.text.trim()
    }
  }

  let shift: "diurno" | "noturno" = "diurno"
  for (const f of frags) {
    if (/\/(DIURNO|NOTURNO)\b/i.test(f.text)) {
      shift = f.text.toUpperCase().includes("NOTURNO") ? "noturno" : "diurno"
      break
    }
  }

  if (!courseName) {
    throw new Error("Não foi possível detectar o nome do curso na primeira página do PDF.")
  }

  return { courseName: formatCourseName(courseName), shift }
}

function rowsFromContent(
  frags: Fragment[],
  content: string,
  startPeriod: number,
  startInsideObrig: boolean,
) {
  const events: SectionEvent[] = []
  for (const f of frags) {
    const event = classifyFragment(f.text)
    if (event) events.push({ ...event, y: f.y })
  }
  events.sort((a, b) => b.y - a.y)

  const seps = extractRowSeparators(content)
  const rows: ParsedRow[] = []
  let currentPeriod = startPeriod
  let insideObrig = startInsideObrig
  let eventIdx = 0

  for (let i = 0; i < seps.length - 1; i++) {
    const top = seps[i]
    const bottom = seps[i + 1]

    while (eventIdx < events.length && events[eventIdx].y >= top - 1) {
      const event = events[eventIdx++]
      if (event.kind === "period") currentPeriod = event.period
      else if (event.kind === "obrig_start") insideObrig = true
      else if (event.kind === "section_end") insideObrig = false
    }

    if (!insideObrig || !currentPeriod) continue

    const row = parseRowBand(frags, top, bottom, currentPeriod)
    if (row) rows.push(row)
  }

  return { rows, endPeriod: currentPeriod, insideObrig }
}

export function parseCurriculumPdfBuffer(buffer: Buffer): ParsedCurriculum {
  const streams = extractContentStreams(buffer)
  if (streams.length === 0) {
    throw new Error("PDF sem conteúdo de texto reconhecível.")
  }

  const metadata = extractMetadata(extractFragments(streams[0]))
  const parsedRows: ParsedRow[] = []
  let currentPeriod = 0
  let insideObrig = false

  for (const content of streams) {
    const frags = extractFragments(content)
    const result = rowsFromContent(
      frags,
      content,
      insideObrig ? currentPeriod : 0,
      insideObrig,
    )
    parsedRows.push(...result.rows)
    currentPeriod = result.endPeriod
    insideObrig = result.insideObrig
  }

  const classes: ParsedCurriculumClass[] = []
  const prerequisites: ParsedCurriculumPrerequisite[] = []
  const seenCodes = new Set<string>()

  for (const row of mergeMultilineRows(parsedRows)) {
    if (!OBRIG_NATURE.has(row.natureza)) continue

    const match = row.activity.match(ACTIVITY_RE)
    if (!match) continue

    const code = match[1].toUpperCase()
    if (seenCodes.has(code)) continue
    seenCodes.add(code)

    const credits = Number.parseInt(row.credits, 10)
    classes.push({
      ref_period: row.period,
      code,
      name: formatClassName(match[2]),
      description: null,
      credits: Number.isFinite(credits) ? credits : 0,
      elective: false,
    })

    for (const prerequisite_code of row.prereqs) {
      prerequisites.push({ code, prerequisite_code })
    }
  }

  classes.sort((a, b) => a.ref_period - b.ref_period || a.code.localeCompare(b.code))

  if (classes.length === 0) {
    throw new Error("Nenhuma disciplina obrigatória encontrada no PDF.")
  }

  return {
    ...metadata,
    classes,
    prerequisites,
  }
}

export async function parseCurriculumPdfFile(filePath: string): Promise<ParsedCurriculum> {
  const buffer = await readFile(filePath)
  return parseCurriculumPdfBuffer(buffer)
}
