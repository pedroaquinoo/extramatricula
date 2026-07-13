import type { Shift } from "@/lib/shift"

export interface Course {
  id: string
  name: string
  offerId?: string
  shift?: Shift
}

export interface Class {
  ref_period: number
  code: string
  name: string
  description: string | null
  credits: number
  elective: boolean
}

export interface ClassPrerequisite {
  code: string
  prerequisite_code: string
}

export interface ClassWithPrerequisites extends Class {
  prerequisites: Class[]
}

export interface CurriculumData {
  classes: Class[]
  prerequisites: ClassPrerequisite[]
}
