"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, User, Check } from "lucide-react"
import { AvailableClass } from "@/hooks/use-available-classes"
import { useCourseData } from "@/hooks/use-course-data"
import { getShift, isOffShift } from "@/lib/shift"
import { OffShiftBadge } from "@/components/extra/off-shift-badge"
import { OtherOfferingsDialog } from "@/components/extra/other-offerings-dialog"
import { Button } from "../ui/button"

interface AvailableClassListProps {
  availableClasses: AvailableClass[]
  loading: boolean
  error: string | null
  selectedClasses?: AvailableClass[]
  onSelectClass?: (availableClass: AvailableClass) => void
  title?: string
  isClickable?: boolean
  isCourseSelected?: (courseId: string) => boolean
}

export function AvailableClassList({
  availableClasses,
  error,
  selectedClasses = [],
  onSelectClass,
  title = "Disciplinas Disponíveis",
  isClickable = true,
}: AvailableClassListProps) {
  const { course } = useCourseData()
  const shift = getShift(course)

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (availableClasses.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            Nenhuma disciplina disponível para este semestre.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Group classes by course_id
  const grouped = availableClasses.reduce<Record<string, AvailableClass[]>>(
    (acc, cls) => {
      if (!acc[cls.course_id]) acc[cls.course_id] = []
      acc[cls.course_id].push(cls)
      return acc
    },
    {},
  )

  // Helper to check if a group has multiple different names
  const hasMultipleNames = (sections: AvailableClass[]) => {
    const uniqueNames = new Set(sections.map((s) => s.name))
    return uniqueNames.size > 1
  }

  // Helper to extract the differentiating part of the name (after " - ")
  const getShortName = (fullName: string) => {
    const dashIndex = fullName.indexOf(" - ")
    return dashIndex !== -1 ? fullName.slice(dashIndex + 3) : fullName
  }

  // Helper to check if a section is selected
  const isSectionSelected = (cls: AvailableClass) =>
    selectedClasses.some(
      (selected) =>
        selected.course_id === cls.course_id &&
        selected.availabilityCode === cls.availabilityCode,
    )

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">{title}</h3>
      {Object.entries(grouped).map(([courseId, sections]) => {
        const selectedSection = selectedClasses.find((s) => s.course_id == courseId)
        return (
          <Card
            className={`border-0 ${selectedSection ? "border-l-primary" : "border-l-muted"} border-l-4 rounded-none p-0`}
            key={courseId}
          >
            <CardHeader className="flex flex-row items-center justify-between pt-3 px-3">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  {courseId}
                  {selectedSection && <Check className="h-4 w-4 text-primary" />}
                </CardTitle>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {sections[0].name}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {selectedSection && (
                  <Badge variant="secondary" className="text-xs p-1">
                    <Check className="h-4 w-4 text-primary" />
                  </Badge>
                )}
                {isClickable && onSelectClass && (
                  <OtherOfferingsDialog
                    disciplineCode={courseId}
                    disciplineName={sections[0].name}
                    ownCodes={new Set(sections.map((s) => s.availabilityCode))}
                    selectedClasses={selectedClasses}
                    onSelectClass={onSelectClass}
                    shift={shift}
                  />
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              {sections.map((cls) => {
                const selected = isSectionSelected(cls)
                const showName = hasMultipleNames(sections)
                // Only worth flagging when the discipline offers another turma the
                // student could pick instead; with a single option there is no choice.
                const offShift = sections.length > 1 && isOffShift(shift, cls.times)
                return (
                  <Button
                    key={cls.availabilityCode}
                    variant="ghost"
                    disabled={!isClickable}
                    onClick={() => isClickable && onSelectClass && onSelectClass(cls)}
                    className={`w-full flex flex-row items-center justify-between rounded h-fit text-left border border-transparent transition-all ${
                      selected ? "bg-primary/10 border-primary" : "bg-background"
                    } ${isClickable ? "cursor-pointer" : "opacity-60 cursor-not-allowed"}`}
                  >
                    <div className="flex flex-col gap-0.5 w-full">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">
                          {cls.spots} vagas
                        </span>
                        <div className="flex items-center gap-2">
                          {cls.availabilityCode.startsWith("P") && (
                            <Badge variant="outline" className="text-xs text-primary">
                              PRÁTICA
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {cls.availabilityCode}
                          </Badge>
                        </div>
                      </div>
                      {showName && (
                        <p className="text-xs text-muted-foreground font-medium line-clamp-1">
                          {getShortName(cls.name)}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        <span className="text-xs">
                          {cls.times
                            .map((t) => `${t.day.slice(0, 3)} ${t.start}-${t.end}`)
                            .join(", ")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 w-full truncate text-xs">
                        <User className="h-3 w-3" />
                        <span className="text-xs truncate max-w-full">
                          {cls.teachers.join(", ")}
                        </span>
                      </div>
                      {offShift && <OffShiftBadge className="mt-1" />}
                    </div>
                  </Button>
                )
              })}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
