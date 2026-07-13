"use client"

import { useEffect, useMemo, useState, useSyncExternalStore } from "react"
import { usePathname } from "next/navigation"
import { ArrowLeft, GraduationCap, Settings2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { useIsDesktop } from "@/hooks/use-media-query"
import {
  formatCourseDisplay,
  getClasses,
  getCourseById,
  getCourseGroups,
  getDegreeTitle,
  getOfferId,
  getProgramVariants,
  resolveCourseId,
} from "@/lib/curriculum"
import { formatShiftLabel, getShift, type Shift } from "@/lib/shift"
import { captureEvent, registerAnalyticsContext } from "@/lib/analytics"
import { AnalyticsEvents } from "@/lib/analytics-events"
import { useAppStore } from "@/lib/store"
import { cn } from "@/lib/utils"

let requested = false
const listeners = new Set<() => void>()

function setRequested(next: boolean) {
  requested = next
  listeners.forEach((listener) => listener())
}

export function openSetup() {
  setRequested(true)
}

function useSetupRequested() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => requested,
    () => false,
  )
}

type Step = "course" | "semester"

const selectClassName = cn(
  "flex h-11 w-full appearance-none rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
)

function parseSelection(courseId: string) {
  const course = getCourseById(courseId)
  if (!course) return { offerId: "", shift: "" as Shift | "" }
  return {
    offerId: getOfferId(courseId),
    shift: getShift(course) ?? ("" as Shift | ""),
  }
}

function CourseStep({
  offerId,
  shift,
  onOfferIdChange,
  onShiftChange,
  onContinue,
}: {
  offerId: string
  shift: Shift | ""
  onOfferIdChange: (offerId: string) => void
  onShiftChange: (shift: Shift) => void
  onContinue: () => void
}) {
  const groups = getCourseGroups()
  const variants = offerId ? getProgramVariants(offerId) : []
  const canContinue = Boolean(offerId && shift && resolveCourseId(offerId, shift))

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">Curso</span>
        <select
          value={offerId}
          onChange={(event) => onOfferIdChange(event.target.value)}
          className={selectClassName}
        >
          <option value="" disabled>
            Selecione o curso
          </option>
          {groups.map((group) => (
            <option key={group.offerId} value={group.offerId}>
              {group.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">Turno</span>
        <select
          value={shift}
          onChange={(event) => onShiftChange(event.target.value as Shift)}
          disabled={!offerId}
          className={cn(selectClassName, !offerId && "opacity-50")}
        >
          <option value="" disabled>
            Selecione o turno
          </option>
          {variants.map((variant) => (
            <option key={variant.courseId} value={variant.shift}>
              {formatShiftLabel(variant.shift)}
            </option>
          ))}
        </select>
      </label>

      <Button
        size="lg"
        className="w-full sm:size-default"
        disabled={!canContinue}
        onClick={onContinue}
      >
        Continuar
      </Button>

      <p className="text-xs text-muted-foreground">
        Não achou o seu curso? Ele ainda não tem grade no app. Abra uma issue no GitHub e
        ajude a trazê-la.
      </p>
    </div>
  )
}

function SemesterStep({
  courseId,
  selected,
  onSelect,
}: {
  courseId: string
  selected: number | null
  onSelect: (semester: number) => void
}) {
  const semesters = useMemo(() => {
    const periods = getClasses(courseId).map((cls) => cls.ref_period)
    return [...new Set(periods)].sort((a, b) => a - b)
  }, [courseId])

  return (
    <div className="grid grid-cols-5 gap-2">
      {semesters.map((semester) => (
        <button
          key={semester}
          type="button"
          onClick={() => onSelect(semester)}
          className={cn(
            "flex h-12 items-center justify-center rounded-lg border text-sm font-medium tabular-nums transition-[transform,background-color,border-color] duration-150 ease-out active:scale-[0.96]",
            selected === semester
              ? "border-primary bg-primary text-primary-foreground"
              : "hover:bg-muted/50 active:bg-muted/50",
          )}
        >
          {semester}°
        </button>
      ))}
    </div>
  )
}

function SetupBody({ onDone }: { onDone: () => void }) {
  const { courseId, semester, passed, completeSetup } = useAppStore()
  const initial = useMemo(() => parseSelection(courseId), [courseId])
  const [step, setStep] = useState<Step>(courseId ? "semester" : "course")
  const [draftOfferId, setDraftOfferId] = useState(initial.offerId)
  const [draftShift, setDraftShift] = useState<Shift | "">(initial.shift)
  const draftCourse = useMemo(() => {
    if (draftOfferId && draftShift) {
      return resolveCourseId(draftOfferId, draftShift) ?? ""
    }
    return courseId
  }, [draftOfferId, draftShift, courseId])
  const [draftSemester, setDraftSemester] = useState<number | null>(semester)

  const predicted = useMemo(() => {
    if (!draftCourse || !draftSemester) return []
    return getClasses(draftCourse).filter(
      (cls) => !cls.elective && cls.ref_period < draftSemester,
    )
  }, [draftCourse, draftSemester])

  const confirm = () => {
    if (!draftCourse || !draftSemester) return
    // Keep existing selections that still belong to a period before the chosen
    // semester (electives, manual exceptions), but drop anything at or after it —
    // otherwise switching to an earlier semester leaves later classes marked.
    const periodByCode = new Map(
      getClasses(draftCourse).map((cls) => [cls.code, cls.ref_period]),
    )
    const kept =
      draftCourse === courseId
        ? passed.filter((code) => {
            const period = periodByCode.get(code)
            return period !== undefined && period < draftSemester
          })
        : []
    completeSetup(draftCourse, draftSemester, [
      ...kept,
      ...predicted.map((cls) => cls.code),
    ])
    registerAnalyticsContext(draftCourse, draftSemester)
    captureEvent(AnalyticsEvents.SETUP_COMPLETED, {
      course_title: getDegreeTitle(draftCourse),
      semester: draftSemester,
    })
    onDone()
  }

  const courseLabel = useMemo(() => {
    const course = draftCourse ? getCourseById(draftCourse) : undefined
    return course ? formatCourseDisplay(course) : ""
  }, [draftCourse])

  return (
    <div className="flex flex-col gap-4 px-4 pb-6 sm:px-0 sm:pb-0">
      {step === "course" ? (
        <CourseStep
          offerId={draftOfferId}
          shift={draftShift}
          onOfferIdChange={(nextOfferId) => {
            setDraftOfferId(nextOfferId)
            setDraftShift(getProgramVariants(nextOfferId)[0]?.shift ?? "")
          }}
          onShiftChange={setDraftShift}
          onContinue={() => setStep("semester")}
        />
      ) : (
        <>
          {courseLabel && (
            <p className="text-sm font-medium text-pretty">{courseLabel}</p>
          )}

          <SemesterStep
            courseId={draftCourse}
            selected={draftSemester}
            onSelect={setDraftSemester}
          />

          <p className="text-sm text-pretty text-muted-foreground" aria-live="polite">
            {!draftSemester
              ? "Usamos o período para saber o que você já cursou e o que vem a seguir."
              : predicted.length === 0
                ? "No 1° período não há nada a marcar, você ainda não cursou disciplinas."
                : `Vamos marcar as ${predicted.length} obrigatórias do 1° ao ${draftSemester - 1}° período como cursadas. Você corrige as exceções na grade curricular.`}
          </p>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="lg"
              className="sm:size-default"
              onClick={() => setStep("course")}
            >
              <ArrowLeft className="size-4" />
              Curso
            </Button>
            <Button
              size="lg"
              className="flex-1 sm:size-default"
              disabled={!draftSemester}
              onClick={confirm}
            >
              Começar
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

export function SetupPrompt() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
      <GraduationCap className="size-6 text-muted-foreground" />
      <p className="text-sm text-muted-foreground text-pretty">
        Escolha seu curso, turno e período para usar o app.
      </p>
      <Button onClick={openSetup}>Escolher curso</Button>
    </div>
  )
}

export function SetupDialog() {
  const { courseId, semester } = useAppStore()
  const isDesktop = useIsDesktop()
  const pathname = usePathname()
  const asked = useSetupRequested()

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const missing = !courseId || !semester
  const shared = pathname.startsWith("/s")
  const open = mounted && (asked || (missing && !shared))

  const onOpenChange = (next: boolean) => {
    if (next) return
    setRequested(false)
  }

  const title = missing ? "Bem-vindo ao Extramatrícula" : "Curso e período"
  const description = missing
    ? "Escolha seu curso, turno e em que período você está. Fica salvo neste navegador."
    : "Trocar o curso recomeça sua grade curricular."

  const body = <SetupBody onDone={() => setRequested(false)} />

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton={!missing}
          onInteractOutside={(event) => missing && event.preventDefault()}
          onEscapeKeyDown={(event) => missing && event.preventDefault()}
          className="sm:max-w-md"
        >
          <DialogHeader>
            <span className="mb-1 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {missing ? (
                <GraduationCap className="size-5" />
              ) : (
                <Settings2 className="size-5" />
              )}
            </span>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription className="text-pretty">{description}</DialogDescription>
          </DialogHeader>
          {body}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} dismissible={!missing}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription className="text-pretty">{description}</DrawerDescription>
        </DrawerHeader>
        {body}
      </DrawerContent>
    </Drawer>
  )
}
