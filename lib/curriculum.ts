import coursesIndexData from "@/data/curriculum/index.json"
import type {
  Class,
  ClassPrerequisite,
  ClassWithPrerequisites,
  Course,
  CurriculumData,
} from "@/lib/types/curriculum"
import { compareShifts, formatShiftLabel, getShift, type Shift } from "@/lib/shift"

// The course index is small (~3 KB) and needed everywhere, so it stays static.
const coursesIndex = coursesIndexData as Course[]

// --- Lazy-loaded curriculum data with caching ---

const curriculumCache = new Map<string, CurriculumData>()
const loadingPromises = new Map<string, Promise<CurriculumData>>()

const loaders: Record<string, () => Promise<{ default: CurriculumData }>> = {
  "ciencia-computacao-diurno": () => import("@/data/curriculum/ciencia-computacao-diurno.json"),
  "ciencia-computacao-vespertino": () => import("@/data/curriculum/ciencia-computacao-vespertino.json"),
  "controle-automacao-diurno": () => import("@/data/curriculum/controle-automacao-diurno.json"),
  "controle-automacao-noturno": () => import("@/data/curriculum/controle-automacao-noturno.json"),
  "eng-aeroespacial-diurno": () => import("@/data/curriculum/eng-aeroespacial-diurno.json"),
  "eng-agricola-ambiental-diurno": () => import("@/data/curriculum/eng-agricola-ambiental-diurno.json"),
  "eng-alimentos-diurno": () => import("@/data/curriculum/eng-alimentos-diurno.json"),
  "eng-alimentos-noturno": () => import("@/data/curriculum/eng-alimentos-noturno.json"),
  "eng-ambiental-diurno": () => import("@/data/curriculum/eng-ambiental-diurno.json"),
  "eng-civil-diurno": () => import("@/data/curriculum/eng-civil-diurno.json"),
  "eng-computacao-vespertino": () => import("@/data/curriculum/eng-computacao-vespertino.json"),
  "eng-eletrica-diurno": () => import("@/data/curriculum/eng-eletrica-diurno.json"),
  "eng-materiais-diurno": () => import("@/data/curriculum/eng-materiais-diurno.json"),
  "eng-mecanica-diurno": () => import("@/data/curriculum/eng-mecanica-diurno.json"),
  "eng-mecanica-noturno": () => import("@/data/curriculum/eng-mecanica-noturno.json"),
  "eng-metalurgica-diurno": () => import("@/data/curriculum/eng-metalurgica-diurno.json"),
  "eng-minas-diurno": () => import("@/data/curriculum/eng-minas-diurno.json"),
  "eng-producao-diurno": () => import("@/data/curriculum/eng-producao-diurno.json"),
  "eng-quimica-diurno": () => import("@/data/curriculum/eng-quimica-diurno.json"),
  "eng-sistemas-noturno": () => import("@/data/curriculum/eng-sistemas-noturno.json"),
  "estatistica-diurno": () => import("@/data/curriculum/estatistica-diurno.json"),
  "sistemas-informacao-noturno": () => import("@/data/curriculum/sistemas-informacao-noturno.json"),
  "sistemas-informacao-vespertino": () => import("@/data/curriculum/sistemas-informacao-vespertino.json"),
}

/**
 * Asynchronously loads curriculum data for a course.
 * Returns cached data if already loaded.
 */
export async function loadCurriculum(courseId: string): Promise<CurriculumData | null> {
  if (curriculumCache.has(courseId)) return curriculumCache.get(courseId)!

  const loader = loaders[courseId]
  if (!loader) return null

  if (!loadingPromises.has(courseId)) {
    const promise = loader()
      .then((mod) => {
        const data = mod.default as unknown as CurriculumData
        curriculumCache.set(courseId, data)
        loadingPromises.delete(courseId)
        return data
      })
      .catch(() => {
        loadingPromises.delete(courseId)
        return null as unknown as CurriculumData
      })
    loadingPromises.set(courseId, promise)
  }

  return loadingPromises.get(courseId)!
}

function getCurriculumData(courseId: string): CurriculumData | undefined {
  return curriculumCache.get(courseId)
}

/** Check if curriculum data is already loaded for a course */
export function isCurriculumLoaded(courseId: string): boolean {
  return curriculumCache.has(courseId)
}

// --- Course index functions (always available, no async needed) ---

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

// --- Curriculum data functions (require loadCurriculum to be called first) ---

export function getClasses(courseId: string): Class[] {
  return getCurriculumData(courseId)?.classes ?? []
}

export function getCreditsByCode(code: string): number {
  for (const data of curriculumCache.values()) {
    const cls = data.classes.find((c) => c.code === code)
    if (cls) return cls.credits
  }
  return 0
}

export function getPrerequisites(courseId: string): ClassPrerequisite[] {
  return getCurriculumData(courseId)?.prerequisites ?? []
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
