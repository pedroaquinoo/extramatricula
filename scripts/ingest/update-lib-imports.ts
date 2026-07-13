import { access, readdir, readFile, writeFile } from "fs/promises"
import path from "path"

const ROOT = process.cwd()
const CURRICULUM_DIR = path.join(ROOT, "data", "curriculum")
const CURRICULUM_INDEX = path.join(CURRICULUM_DIR, "index.json")
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
  const curriculumImports = courseIds
    .map((id) => `import ${toCamelCase(id)} from "@/data/curriculum/${id}.json"`)
    .join("\n")

  const curriculumMap = courseIds.map((id) => `  "${id}": ${toCamelCase(id)},`).join("\n")

  return `import coursesIndexData from "@/data/curriculum/index.json"
${curriculumImports}
import type {
  Class,
  ClassPrerequisite,
  ClassWithPrerequisites,
  Course,
  CurriculumData,
} from "@/lib/types/curriculum"
import { compareShifts, formatShiftLabel, getShift, type Shift } from "@/lib/shift"

const curriculumByCourseId: Record<string, CurriculumData> = {
${curriculumMap}
}

const coursesIndex = coursesIndexData as Course[]

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
  return [...groups.values()]
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

export function getOfferId(courseId: string): string {
  const course = getCourseById(courseId)
  return course?.offerId ?? courseId
}

export function getClasses(courseId: string): Class[] {
  return curriculumByCourseId[courseId]?.classes ?? []
}

export function getPrerequisites(courseId: string): ClassPrerequisite[] {
  return curriculumByCourseId[courseId]?.prerequisites ?? []
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
  const offerImports = offerFiles
    .map((offer) => {
      const importName = toOfferImportName(offer.term, offer.offerId)
      return `import ${importName} from "${offer.importPath}"`
    })
    .join("\n")

  const offersByTerm = new Map<string, string[]>()
  for (const offer of offerFiles) {
    const importName = toOfferImportName(offer.term, offer.offerId)
    const lines = offersByTerm.get(offer.term) ?? []
    lines.push(`    "${offer.offerId}": ${importName} as AvailableClass[],`)
    offersByTerm.set(offer.term, lines)
  }

  const offersMap = [...offersByTerm.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([term, lines]) => `  "${term}": {\n${lines.join("\n")}\n  },`)
    .join("\n")

  return `import offersIndex from "@/data/offers/index.json"
${offerImports}
import { getOfferId } from "@/lib/curriculum"
import type { AvailableClass } from "@/hooks/use-available-classes"

const offersByTermAndOfferId: Record<string, Record<string, AvailableClass[]>> = {
${offersMap}
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
  return offersByTermAndOfferId[term]?.[offerId] ?? []
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
`
}

export async function syncCurriculumLib(): Promise<string[]> {
  const courseIds = await readCurriculumCourseIds()
  await writeFile(CURRICULUM_LIB, buildCurriculumLib(courseIds) + "\n")
  return courseIds
}

export async function syncOffersLib(): Promise<OfferFile[]> {
  await readFile(OFFERS_INDEX, "utf8")
  const offerFiles = await listOfferFiles()
  await writeFile(OFFERS_LIB, buildOffersLib(offerFiles) + "\n")
  return offerFiles
}
