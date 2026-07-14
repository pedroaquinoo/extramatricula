import { access, readdir, readFile, writeFile } from "fs/promises"
import path from "path"

const ROOT = process.cwd()
const CURRICULUM_DIR = path.join(ROOT, "data", "curriculum")
const CURRICULUM_INDEX = path.join(CURRICULUM_DIR, "index.json")
const CURRICULUM_CREDITS = path.join(CURRICULUM_DIR, "credits.json")
const CURRICULUM_LIB = path.join(ROOT, "lib", "curriculum.ts")
const OFFERS_DIR = path.join(ROOT, "data", "offers")
const OFFERS_INDEX = path.join(OFFERS_DIR, "index.json")
const OFFERS_LIB = path.join(ROOT, "lib", "offers.ts")

interface CourseIndexEntry {
  id: string
}

interface OffersIndex {
  current: string
  terms: string[]
  programsByTerm?: Record<string, string[]>
}

interface OfferFile {
  term: string
  offerId: string
  importPath: string
}

function toCamelCase(slug: string): string {
  const [first, ...rest] = slug.split("-")
  return first + rest.map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join("")
}

function toOfferImportName(term: string, offerId: string): string {
  const termPart = term.replace("/", "")
  const offerPart = offerId
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("")
  return `offer${termPart}${offerPart}`
}

function termFromSlug(slug: string): string {
  return slug.replace(/-(\d+)$/, "/$1")
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

async function readCurriculumCourseIds(): Promise<string[]> {
  const raw = await readFile(CURRICULUM_INDEX, "utf8")
  const courses = JSON.parse(raw) as CourseIndexEntry[]
  const ids = [...new Set(courses.map((course) => course.id))].sort()

  for (const id of ids) {
    const filePath = path.join(CURRICULUM_DIR, `${id}.json`)
    if (!(await fileExists(filePath))) {
      throw new Error(`Arquivo de grade ausente para ${id}: data/curriculum/${id}.json`)
    }
  }

  return ids
}

async function listOfferFiles(): Promise<OfferFile[]> {
  const entries: OfferFile[] = []
  const dirs = await readdir(OFFERS_DIR, { withFileTypes: true })

  for (const dir of dirs) {
    if (!dir.isDirectory()) continue

    const term = termFromSlug(dir.name)
    const termDir = path.join(OFFERS_DIR, dir.name)
    const files = await readdir(termDir)

    for (const file of files) {
      if (!file.endsWith(".json")) continue
      entries.push({
        term,
        offerId: file.slice(0, -".json".length),
        importPath: `@/data/offers/${dir.name}/${file}`,
      })
    }
  }

  return entries.sort(
    (a, b) => a.term.localeCompare(b.term) || a.offerId.localeCompare(b.offerId),
  )
}

function buildCurriculumLib(courseIds: string[]): string {
  const loaderEntries = courseIds
    .map((id) => `  "${id}": () =>\n    import("@/data/curriculum/${id}.json"),`)
    .join("\n")

  return `import coursesIndexData from "@/data/curriculum/index.json"
import creditsByCodeData from "@/data/curriculum/credits.json"
import type {
  Class,
  ClassPrerequisite,
  ClassWithPrerequisites,
  Course,
  CurriculumData,
} from "@/lib/types/curriculum"
import { compareShifts, formatShiftLabel, getShift, type Shift } from "@/lib/shift"

const curriculumLoaders: Record<string, () => Promise<{ default: CurriculumData }>> = {
${loaderEntries}
}

const curriculumCache = new Map<string, CurriculumData>()
const curriculumLoading = new Map<string, Promise<CurriculumData | null>>()

// A discipline code carries the same credits in every program, so a single global
// map covers all of them. Seeded eagerly from a generated code→credits index (tiny,
// unlike the full curricula which load lazily) so credits are available for turmas
// from programs whose curriculum hasn't been loaded — e.g. optional/cross-offer classes.
const creditsByCode = new Map<string, number>(
  Object.entries(creditsByCodeData as Record<string, number>),
)

const coursesIndex = coursesIndexData as Course[]

function indexCredits(data: CurriculumData) {
  for (const cls of data.classes) {
    if (!creditsByCode.has(cls.code)) creditsByCode.set(cls.code, cls.credits)
  }
}

export function isCurriculumLoaded(courseId: string): boolean {
  return curriculumCache.has(courseId)
}

export async function loadCurriculum(courseId: string): Promise<CurriculumData | null> {
  if (!courseId) return null
  const cached = curriculumCache.get(courseId)
  if (cached) return cached

  const inFlight = curriculumLoading.get(courseId)
  if (inFlight) return inFlight

  const loader = curriculumLoaders[courseId]
  if (!loader) return null

  const promise = loader()
    .then((module) => {
      const data = module.default
      curriculumCache.set(courseId, data)
      indexCredits(data)
      return data
    })
    .catch(() => null)
    .finally(() => {
      curriculumLoading.delete(courseId)
    })

  curriculumLoading.set(courseId, promise)
  return promise
}

export interface CourseGroup {
  offerId: string
  name: string
  shifts: Shift[]
}

export interface ProgramVariant {
  courseId: string
  shift: Shift
}

export function getCourseGroups(): CourseGroup[] {
  const groups = new Map<string, CourseGroup>()
  for (const course of coursesIndex) {
    const offerId = course.offerId ?? course.id
    const shift = getShift(course) ?? "diurno"
    const existing = groups.get(offerId)
    if (existing) {
      if (!existing.shifts.includes(shift)) {
        existing.shifts.push(shift)
        existing.shifts.sort(compareShifts)
      }
      continue
    }
    groups.set(offerId, { offerId, name: course.name, shifts: [shift] })
  }
  return [...groups.values()].sort((a, b) =>
    a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }),
  )
}

export function getProgramVariants(offerId: string): ProgramVariant[] {
  return coursesIndex
    .filter((course) => (course.offerId ?? course.id) === offerId)
    .map((course) => ({
      courseId: course.id,
      shift: getShift(course) ?? "diurno",
    }))
    .sort((a, b) => compareShifts(a.shift, b.shift))
}

export function resolveCourseId(offerId: string, shift: Shift): string | undefined {
  return getProgramVariants(offerId).find((variant) => variant.shift === shift)?.courseId
}

export function formatCourseDisplay(course: Course): string {
  const shift = getShift(course)
  if (!shift) return course.name
  return \`\${course.name} · \${formatShiftLabel(shift)}\`
}

export function getCourses(): Course[] {
  return coursesIndex
}

export function getCourseById(courseId: string): Course | undefined {
  return coursesIndex.find((course) => course.id === courseId)
}

export function getDegreeTitle(courseId: string): string {
  return getCourseById(courseId)?.name ?? courseId
}

export function getOfferId(courseId: string): string {
  const course = getCourseById(courseId)
  return course?.offerId ?? courseId
}

export function getClasses(courseId: string): Class[] {
  return curriculumCache.get(courseId)?.classes ?? []
}

export function getCreditsByCode(code: string): number {
  return creditsByCode.get(code) ?? 0
}

export function getPrerequisites(courseId: string): ClassPrerequisite[] {
  return curriculumCache.get(courseId)?.prerequisites ?? []
}

export function getClassesWithPrerequisites(courseId: string): ClassWithPrerequisites[] {
  const classes = getClasses(courseId)
  const prerequisites = getPrerequisites(courseId)
  const classByCode = new Map(classes.map((cls) => [cls.code, cls]))

  return classes.map((cls) => ({
    ...cls,
    prerequisites: prerequisites
      .filter((prereq) => prereq.code === cls.code)
      .map((prereq) => classByCode.get(prereq.prerequisite_code))
      .filter((prereq): prereq is Class => Boolean(prereq)),
  }))
}

export function isLocked(code: string, courseId: string, passed: Set<string>): boolean {
  const prerequisites = getPrerequisites(courseId).filter(
    (prereq) => prereq.code === code,
  )
  if (prerequisites.length === 0) return false
  return !prerequisites.every((prereq) => passed.has(prereq.prerequisite_code))
}
`
}

function buildOffersLib(offerFiles: OfferFile[]): string {
  const loaderEntries = offerFiles
    .map((offer) => {
      const key = `${offer.term}:${offer.offerId}`
      return `  "${key}": () =>\n    import("${offer.importPath}"),`
    })
    .join("\n")

  return `import offersIndexData from "@/data/offers/index.json"
import { getOfferId } from "@/lib/curriculum"
import type { AvailableClass } from "@/hooks/use-available-classes"

const offersIndex = offersIndexData as {
  current: string
  terms: string[]
  programsByTerm?: Record<string, string[]>
}

const offerLoaders: Record<string, () => Promise<{ default: AvailableClass[] }>> = {
${loaderEntries}
}

const offerCache = new Map<string, AvailableClass[]>()
const offerLoading = new Map<string, Promise<AvailableClass[]>>()
const termLoading = new Map<string, Promise<void>>()

function offerKey(term: string, offerId: string): string {
  return \`\${term}:\${offerId}\`
}

export function isOfferLoaded(term: string, offerId: string): boolean {
  return offerCache.has(offerKey(term, offerId))
}

export async function loadOffer(term: string, offerId: string): Promise<AvailableClass[]> {
  const key = offerKey(term, offerId)
  const cached = offerCache.get(key)
  if (cached) return cached

  const inFlight = offerLoading.get(key)
  if (inFlight) return inFlight

  const loader = offerLoaders[key]
  if (!loader) return []

  const promise = loader()
    .then((module) => {
      const data = module.default
      offerCache.set(key, data)
      return data
    })
    .catch(() => [] as AvailableClass[])
    .finally(() => {
      offerLoading.delete(key)
    })

  offerLoading.set(key, promise)
  return promise
}

export async function loadTermOffers(term: string): Promise<void> {
  const programs = offersIndex.programsByTerm?.[term] ?? []
  if (programs.length === 0) return

  const inFlight = termLoading.get(term)
  if (inFlight) return inFlight

  const promise = Promise.all(programs.map((offerId) => loadOffer(term, offerId))).then(
    () => undefined,
  )
  termLoading.set(term, promise)
  await promise
  termLoading.delete(term)
}

export function getCurrentOfferTerm(): string {
  return offersIndex.current
}

export function getOfferTerms(): string[] {
  return offersIndex.terms
}

export function getOfferForProgram(term: string, courseId: string): AvailableClass[] {
  if (!courseId) return []
  const offerId = getOfferId(courseId)
  return offerCache.get(offerKey(term, offerId)) ?? []
}

export function getCurrentOfferForProgram(courseId: string): AvailableClass[] {
  return getOfferForProgram(getCurrentOfferTerm(), courseId)
}

export function findTurma(
  term: string,
  courseId: string,
  disciplineCode: string,
  availabilityCode: string,
): AvailableClass | undefined {
  return getOfferForProgram(term, courseId).find(
    (cls) =>
      cls.course_id === disciplineCode && cls.availabilityCode === availabilityCode,
  )
}

export type TurmaAcrossOffers = AvailableClass & { offerIds: string[] }

export async function findTurmasAcrossOffers(
  term: string,
  disciplineCode: string,
): Promise<TurmaAcrossOffers[]> {
  await loadTermOffers(term)

  const byAvailabilityCode = new Map<string, TurmaAcrossOffers>()
  const programs = offersIndex.programsByTerm?.[term] ?? []

  for (const offerId of programs) {
    const classes = offerCache.get(offerKey(term, offerId)) ?? []
    for (const cls of classes) {
      if (cls.course_id !== disciplineCode) continue
      const existing = byAvailabilityCode.get(cls.availabilityCode)
      if (existing) {
        if (!existing.offerIds.includes(offerId)) existing.offerIds.push(offerId)
      } else {
        byAvailabilityCode.set(cls.availabilityCode, { ...cls, offerIds: [offerId] })
      }
    }
  }

  return Array.from(byAvailabilityCode.values())
}
`
}

async function buildCreditsIndex(courseIds: string[]): Promise<Record<string, number>> {
  const credits: Record<string, number> = {}
  for (const id of courseIds) {
    const raw = await readFile(path.join(CURRICULUM_DIR, `${id}.json`), "utf8")
    const data = JSON.parse(raw) as { classes: Array<{ code: string; credits: number }> }
    for (const cls of data.classes) {
      if (!(cls.code in credits)) credits[cls.code] = cls.credits
    }
  }
  return Object.fromEntries(
    Object.keys(credits)
      .sort()
      .map((code) => [code, credits[code]]),
  )
}

export async function syncCurriculumLib(): Promise<string[]> {
  const courseIds = await readCurriculumCourseIds()
  const credits = await buildCreditsIndex(courseIds)
  await writeFile(CURRICULUM_CREDITS, JSON.stringify(credits, null, 2) + "\n")
  await writeFile(CURRICULUM_LIB, buildCurriculumLib(courseIds) + "\n")
  return courseIds
}

export async function syncOffersLib(): Promise<OfferFile[]> {
  await readFile(OFFERS_INDEX, "utf8")
  const offerFiles = await listOfferFiles()
  await writeFile(OFFERS_LIB, buildOffersLib(offerFiles) + "\n")
  return offerFiles
}
