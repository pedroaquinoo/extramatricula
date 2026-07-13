import coursesIndexData from "@/data/curriculum/index.json"
import controleAutomacaoDiurno from "@/data/curriculum/controle-automacao-diurno.json"
import controleAutomacaoNoturno from "@/data/curriculum/controle-automacao-noturno.json"
import engProducaoDiurno from "@/data/curriculum/eng-producao-diurno.json"
import type {
  Class,
  ClassPrerequisite,
  ClassWithPrerequisites,
  Course,
  CurriculumData,
} from "@/lib/types/curriculum"
import { formatShiftLabel, getShift, type Shift } from "@/lib/shift"

const curriculumByCourseId: Record<string, CurriculumData> = {
  "controle-automacao-diurno": controleAutomacaoDiurno,
  "controle-automacao-noturno": controleAutomacaoNoturno,
  "eng-producao-diurno": engProducaoDiurno,
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
        existing.shifts.sort((a, b) => a.localeCompare(b))
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
    .sort((a, b) => a.shift.localeCompare(b.shift))
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

