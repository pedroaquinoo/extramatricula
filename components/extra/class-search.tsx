"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { Clock, Users } from "lucide-react"
import { useAvailableClasses, type AvailableClass } from "@/hooks/use-available-classes"
import { useCourseData } from "@/hooks/use-course-data"
import { isLocked } from "@/lib/curriculum"
import { getCurrentOfferTerm } from "@/lib/offers"
import { getShift, isOffShift } from "@/lib/shift"
import { OffShiftBadge } from "@/components/extra/off-shift-badge"

type ClassSearchProps = {
  onSelectClass: (cls: AvailableClass) => void
  selectedClasses: AvailableClass[]
  ignorePrereqs?: boolean
}

export function ClassSearch({
  onSelectClass,
  selectedClasses,
  ignorePrereqs = false,
}: ClassSearchProps) {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const { availableClasses } = useAvailableClasses()
  const { course, courseId, passedSet } = useCourseData()
  const shift = getShift(course)
  const term = getCurrentOfferTerm()

  // Hide classes the user has already taken, plus disciplines still locked by unmet
  // prerequisites — they can't be enrolled in yet, so surfacing them here is misleading.
  // When the student opts to ignore prerequisites, keep the locked disciplines visible.
  const classes = availableClasses.filter(
    (cls) =>
      !passedSet.has(cls.course_id) &&
      (ignorePrereqs || !(courseId && isLocked(cls.course_id, courseId, passedSet))),
  )

  const sectionCounts = classes.reduce<Record<string, number>>((acc, cls) => {
    acc[cls.course_id] = (acc[cls.course_id] ?? 0) + 1
    return acc
  }, {})

  useEffect(() => {
    if (open) {
      const commandList = document.querySelector('[data-slot="command-list"]')
      if (commandList) {
        commandList.scrollTop = 0
      }
    }
  }, [searchValue, open])

  const formatTime = (time: { day: string; start: string; end: string }) => {
    return `${time.day} ${time.start}-${time.end}`
  }

  const formatTeachers = (teachers: string[]) => {
    return teachers.join(", ")
  }

  const isSelected = (cls: AvailableClass) =>
    selectedClasses.some(
      (selected) =>
        selected.course_id === cls.course_id &&
        selected.availabilityCode === cls.availabilityCode,
    )

  return (
    <>
      <Button
        variant="outline"
        size="lg"
        onClick={() => setOpen(true)}
        className="flex items-center justify-start gap-2 w-full rounded-lg"
      >
        <Search className="h-4 w-4" />
        Buscar Disciplinas
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <CommandInput
            placeholder="Buscar disciplinas por código, nome ou professor..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList className="min-h-[60vh]">
            <CommandEmpty>Nenhuma disciplina encontrada.</CommandEmpty>
            <CommandGroup heading={`Disciplinas Disponíveis em ${term}`}>
              {classes.map((classItem) => (
                <CommandItem
                  key={`${classItem.course_id}-${classItem.availabilityCode}`}
                  className={`flex flex-col items-start gap-2 p-4 w-full ${isSelected(classItem) ? "bg-primary/10 border-primary" : "bg-background"}`}
                  onSelect={() => onSelectClass(classItem)}
                >
                  <div className="flex items-center gap-2 w-full">
                    <div className="flex items-center gap-2 flex-1">
                      <Badge variant="outline" className="font-mono text-xs">
                        {classItem.course_id}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {classItem.availabilityCode}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{classItem.spots} vagas</span>
                    </div>
                  </div>
                  <div className="w-full">
                    <p className="font-medium text-sm">{classItem.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTeachers(classItem.teachers)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {classItem.times.map((time, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatTime(time)}
                      </Badge>
                    ))}
                    {sectionCounts[classItem.course_id] > 1 &&
                      isOffShift(shift, classItem.times) && <OffShiftBadge />}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}
