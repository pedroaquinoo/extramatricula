import coursesIndexData from "@/data/curriculum/index.json"
import cienciaComputacaoDiurno from "@/data/curriculum/ciencia-computacao-diurno.json"
import cienciaComputacaoVespertino from "@/data/curriculum/ciencia-computacao-vespertino.json"
import controleAutomacaoDiurno from "@/data/curriculum/controle-automacao-diurno.json"
import controleAutomacaoNoturno from "@/data/curriculum/controle-automacao-noturno.json"
import engAeroespacialDiurno from "@/data/curriculum/eng-aeroespacial-diurno.json"
import engCivilDiurno from "@/data/curriculum/eng-civil-diurno.json"
import engComputacaoVespertino from "@/data/curriculum/eng-computacao-vespertino.json"
import engEletricaDiurno from "@/data/curriculum/eng-eletrica-diurno.json"
import engMecanicaDiurno from "@/data/curriculum/eng-mecanica-diurno.json"
import engMecanicaNoturno from "@/data/curriculum/eng-mecanica-noturno.json"
import engMetalurgicaDiurno from "@/data/curriculum/eng-metalurgica-diurno.json"
import engMinasDiurno from "@/data/curriculum/eng-minas-diurno.json"
import engProducaoDiurno from "@/data/curriculum/eng-producao-diurno.json"
import engQuimicaDiurno from "@/data/curriculum/eng-quimica-diurno.json"
import engSistemasNoturno from "@/data/curriculum/eng-sistemas-noturno.json"
import estatisticaDiurno from "@/data/curriculum/estatistica-diurno.json"
import type {
  Class,
  ClassPrerequisite,
  ClassWithPrerequisites,
  Course,
  CurriculumData,
} from "@/lib/types/curriculum"
import { compareShifts, formatShiftLabel, getShift, type Shift } from "@/lib/shift"

const curriculumByCourseId: Record<string, CurriculumData> = {
  "ciencia-computacao-diurno": cienciaComputacaoDiurno,
  "ciencia-computacao-vespertino": cienciaComputacaoVespertino,
  "controle-automacao-diurno": controleAutomacaoDiurno,
  "controle-automacao-noturno": controleAutomacaoNoturno,
  "eng-aeroespacial-diurno": engAeroespacialDiurno,
  "eng-civil-diurno": engCivilDiurno,
  "eng-computacao-vespertino": engComputacaoVespertino,
  "eng-eletrica-diurno": engEletricaDiurno,
  "eng-mecanica-diurno": engMecanicaDiurno,
  "eng-mecanica-noturno": engMecanicaNoturno,
  "eng-metalurgica-diurno": engMetalurgicaDiurno,
  "eng-minas-diurno": engMinasDiurno,
  "eng-producao-diurno": engProducaoDiurno,
  "eng-quimica-diurno": engQuimicaDiurno,
  "eng-sistemas-noturno": engSistemasNoturno,
  "estatistica-diurno": estatisticaDiurno,
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

