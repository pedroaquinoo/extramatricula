import coursesIndexData from "@/data/curriculum/index.json"
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
  "ciencia-computacao-diurno": () =>
    import("@/data/curriculum/ciencia-computacao-diurno.json"),
  "ciencia-computacao-vespertino": () =>
    import("@/data/curriculum/ciencia-computacao-vespertino.json"),
  "controle-automacao-diurno": () =>
    import("@/data/curriculum/controle-automacao-diurno.json"),
  "controle-automacao-noturno": () =>
    import("@/data/curriculum/controle-automacao-noturno.json"),
  "eng-aeroespacial-diurno": () =>
    import("@/data/curriculum/eng-aeroespacial-diurno.json"),
  "eng-agricola-ambiental-diurno": () =>
    import("@/data/curriculum/eng-agricola-ambiental-diurno.json"),
  "eng-alimentos-diurno": () =>
    import("@/data/curriculum/eng-alimentos-diurno.json"),
  "eng-alimentos-noturno": () =>
    import("@/data/curriculum/eng-alimentos-noturno.json"),
  "eng-ambiental-diurno": () =>
    import("@/data/curriculum/eng-ambiental-diurno.json"),
  "eng-civil-diurno": () =>
    import("@/data/curriculum/eng-civil-diurno.json"),
  "eng-computacao-vespertino": () =>
    import("@/data/curriculum/eng-computacao-vespertino.json"),
  "eng-eletrica-diurno": () =>
    import("@/data/curriculum/eng-eletrica-diurno.json"),
  "eng-materiais-diurno": () =>
    import("@/data/curriculum/eng-materiais-diurno.json"),
  "eng-mecanica-diurno": () =>
    import("@/data/curriculum/eng-mecanica-diurno.json"),
  "eng-mecanica-noturno": () =>
    import("@/data/curriculum/eng-mecanica-noturno.json"),
  "eng-metalurgica-diurno": () =>
    import("@/data/curriculum/eng-metalurgica-diurno.json"),
  "eng-minas-diurno": () =>
    import("@/data/curriculum/eng-minas-diurno.json"),
  "eng-producao-diurno": () =>
    import("@/data/curriculum/eng-producao-diurno.json"),
  "eng-quimica-diurno": () =>
    import("@/data/curriculum/eng-quimica-diurno.json"),
  "eng-sistemas-noturno": () =>
    import("@/data/curriculum/eng-sistemas-noturno.json"),
  "estatistica-diurno": () =>
    import("@/data/curriculum/estatistica-diurno.json"),
  "sistemas-informacao-noturno": () =>
    import("@/data/curriculum/sistemas-informacao-noturno.json"),
  "sistemas-informacao-vespertino": () =>
    import("@/data/curriculum/sistemas-informacao-vespertino.json"),
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
  return `${course.name} · ${formatShiftLabel(shift)}`
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

