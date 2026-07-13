import { mkdir, readFile, writeFile } from "fs/promises"
import path from "path"
import { dedupeClasses, parseOfferPdfFile, type AvailableClass } from "./parse-offer-pdf"
import { anonymizeTeachers } from "./teacher-names"
import { syncOffersLib } from "./update-lib-imports"

const ROOT = process.cwd()
const OFFERS_DIR = path.join(ROOT, "data", "offers")
const CURRICULUM_INDEX = path.join(ROOT, "data", "curriculum", "index.json")

interface CourseIndexEntry {
  id: string
  offerId?: string
}

interface OffersIndex {
  current: string
  terms: string[]
  programsByTerm?: Record<string, string[]>
}

function isPdf(file: string): boolean {
  return file.toLowerCase().endsWith(".pdf")
}

function isJson(file: string): boolean {
  return file.toLowerCase().endsWith(".json")
}

async function loadKnownOfferIds(): Promise<Set<string>> {
  const raw = await readFile(CURRICULUM_INDEX, "utf8")
  const courses = JSON.parse(raw) as CourseIndexEntry[]
  const ids = new Set<string>()
  for (const course of courses) {
    ids.add(course.id)
    if (course.offerId) ids.add(course.offerId)
  }
  return ids
}

async function readOffersIndex(): Promise<OffersIndex> {
  try {
    const raw = await readFile(path.join(OFFERS_DIR, "index.json"), "utf8")
    return JSON.parse(raw) as OffersIndex
  } catch {
    return { current: "", terms: [], programsByTerm: {} }
  }
}

async function writeOffersIndex(term: string, terms: string[], offerId: string) {
  const index = await readOffersIndex()
  const programsByTerm = { ...index.programsByTerm }
  const programs = new Set(programsByTerm[term] ?? [])
  programs.add(offerId)
  programsByTerm[term] = [...programs].sort()

  await mkdir(OFFERS_DIR, { recursive: true })
  await writeFile(
    path.join(OFFERS_DIR, "index.json"),
    JSON.stringify({ current: index.current || term, terms, programsByTerm }, null, 2) +
      "\n",
  )
}

function anonymizeOffer(classes: AvailableClass[]): AvailableClass[] {
  return classes.map((cls) => ({
    ...cls,
    teachers: anonymizeTeachers(cls.teachers),
  }))
}

async function parsePdfSources(sources: string[]) {
  let all: Awaited<ReturnType<typeof parseOfferPdfFile>> = []
  for (const source of sources) {
    const classes = await parseOfferPdfFile(source)
    console.log(`  ${path.basename(source)}: ${classes.length} turmas`)
    all = all.concat(classes)
  }
  const deduped = dedupeClasses(all)
  console.log(`Total após deduplicação: ${deduped.length} turmas`)
  return deduped
}

async function main() {
  const [term, offerId, ...sources] = process.argv.slice(2)

  if (!term || !offerId || sources.length === 0) {
    console.error("Uso: pnpm ingest <termo> <offerId> <arquivo.json | pdf1 [pdf2 ...]>")
    console.error(
      "Exemplo JSON: pnpm ingest 2025/2 controle-automacao ./snapshots/oferta.json",
    )
    console.error("Exemplo PDF:  pnpm ingest 2026/2 controle-automacao ./mapa.pdf")
    process.exit(1)
  }

  const knownOfferIds = await loadKnownOfferIds()
  if (!knownOfferIds.has(offerId)) {
    console.error(
      `offerId desconhecido: ${offerId}. Registre-o em data/curriculum/index.json primeiro.`,
    )
    process.exit(1)
  }

  const resolved = sources.map((source) => path.resolve(source))
  const slug = term.replace("/", "-")
  const termDir = path.join(OFFERS_DIR, slug)
  const target = path.join(termDir, `${offerId}.json`)

  await mkdir(termDir, { recursive: true })

  let offer: AvailableClass[]

  if (resolved.every(isPdf)) {
    console.log(`Parseando ${resolved.length} PDF(s) de oferta para ${offerId}...`)
    offer = anonymizeOffer(await parsePdfSources(resolved))
  } else if (resolved.length === 1 && isJson(resolved[0])) {
    const raw = await readFile(resolved[0], "utf8")
    offer = anonymizeOffer(JSON.parse(raw) as AvailableClass[])
  } else {
    console.error(
      "Fonte inválida: informe um único .json ou um ou mais .pdf (não misture os dois).",
    )
    process.exit(1)
  }

  await writeFile(target, JSON.stringify(offer, null, 2) + "\n")

  const index = await readOffersIndex()
  const terms = index.terms.includes(term) ? index.terms : [...index.terms, term]

  await writeOffersIndex(term, terms.sort(), offerId)
  await syncOffersLib()

  console.log(`Oferta ${term}/${offerId} gravada em data/offers/${slug}/${offerId}.json`)
  console.log(`lib/offers.ts atualizado`)
}

main()
