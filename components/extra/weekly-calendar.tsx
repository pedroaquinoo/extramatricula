"use client"

import { useMemo } from "react"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { useIsDesktop } from "@/hooks/use-media-query"
import { X } from "lucide-react"

interface ClassTime {
  day: string
  start: string
  end: string
}

interface Class {
  id: string
  course_id: string
  name: string
  availabilityCode: string
  spots: number
  times: ClassTime[]
  teachers: string[]
}

const dayMapping: Record<string, string> = {
  Segunda: "Mon",
  Terca: "Tue",
  Quarta: "Wed",
  Quinta: "Thu",
  Sexta: "Fri",
}

const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri"]

const dayLabels: Record<string, string> = {
  Mon: "Segunda",
  Tue: "Terça",
  Wed: "Quarta",
  Thu: "Quinta",
  Fri: "Sexta",
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
}

function getClassColor(courseId: string): string {
  const colors = [
    "bg-blue-100 border-blue-300 text-blue-800",
    "bg-green-100 border-green-300 text-green-800",
    "bg-purple-100 border-purple-300 text-purple-800",
    "bg-orange-100 border-orange-300 text-orange-800",
    "bg-pink-100 border-pink-300 text-pink-800",
    "bg-indigo-100 border-indigo-300 text-indigo-800",
    "bg-yellow-100 border-yellow-300 text-yellow-800",
    "bg-teal-100 border-teal-300 text-teal-800",
    "bg-red-100 border-red-300 text-red-800",
    "bg-cyan-100 border-cyan-300 text-cyan-800",
    "bg-lime-100 border-lime-300 text-lime-800",
  ]
  let hash = 5381
  for (let i = 0; i < courseId.length; i++) {
    hash = (hash << 5) + hash + courseId.charCodeAt(i)
  }
  return colors[Math.abs(hash) % colors.length]
}

interface CalendarProps {
  classes?: Class[]
  onRemoveClass?: (classId: string) => void
}

type CalendarEvent = {
  class: Class
  day: string
  startMinutes: number
  endMinutes: number
  duration: number
  overlapPosition?: number
  hasOverlap?: boolean
}

export default function WeeklyCalendar({ classes = [], onRemoveClass }: CalendarProps) {
  const isDesktop = useIsDesktop()

  const { timeSlots, classEvents, minTime } = useMemo(() => {
    const events: CalendarEvent[] = []

    let minTime = Number.POSITIVE_INFINITY
    let maxTime = 0

    classes.forEach((cls) => {
      cls.times.forEach((time) => {
        const englishDay = dayMapping[time.day]
        if (englishDay) {
          const startMinutes = timeToMinutes(time.start)
          const endMinutes = timeToMinutes(time.end)

          minTime = Math.min(minTime, startMinutes)
          maxTime = Math.max(maxTime, endMinutes)

          events.push({
            class: cls,
            day: englishDay,
            startMinutes,
            endMinutes,
            duration: endMinutes - startMinutes,
          })
        }
      })
    })

    // Only the hours the week actually spans: padding down to midnight turned the grid
    // into a wall of empty rows to scroll past on a phone.
    minTime = Number.isFinite(minTime) ? Math.floor(minTime / 60) * 60 : 7 * 60
    maxTime = maxTime > minTime ? Math.ceil(maxTime / 60) * 60 : minTime + 60

    const slots: string[] = []
    for (let time = minTime; time < maxTime; time += 60) {
      slots.push(minutesToTime(time))
    }

    const eventsByDay: Record<string, CalendarEvent[]> = {}
    dayOrder.forEach((day) => {
      eventsByDay[day] = events
        .filter((e) => e.day === day)
        .sort((a, b) => a.startMinutes - b.startMinutes)
    })

    Object.keys(eventsByDay).forEach((day) => {
      const dayEvents = eventsByDay[day]
      dayEvents.forEach((event, idx) => {
        let overlapCount = 0

        for (let i = 0; i < idx; i++) {
          const otherEvent = dayEvents[i]
          if (
            event.startMinutes < otherEvent.endMinutes &&
            event.endMinutes > otherEvent.startMinutes
          ) {
            overlapCount++
          }
        }
        event.overlapPosition = overlapCount
        event.hasOverlap = overlapCount > 0
      })
    })

    return {
      timeSlots: slots,
      classEvents: eventsByDay,
      minTime,
    }
  }, [classes])

  // A phone gives each weekday ~60px, so the grid is sized in rem and the row height
  // shrinks with the viewport: enough to read a code and a time, and nothing else.
  const hourHeight = isDesktop ? 60 : 44

  const getEventStyle = (event: CalendarEvent) => {
    const top = ((event.startMinutes - minTime) / 60) * hourHeight
    const height = (event.duration / 60) * hourHeight
    const left = event.hasOverlap ? (event.overlapPosition ?? 0) * 4 : 0
    const width = event.hasOverlap ? "calc(100% - 8px)" : "100%"

    return {
      position: "absolute" as const,
      top: `${top}px`,
      height: `${height}px`,
      left: `${left}px`,
      width,
      zIndex: (event.overlapPosition ?? 0) + 1,
    }
  }

  const columns =
    "grid grid-cols-[2.25rem_repeat(5,minmax(0,1fr))] sm:grid-cols-[3.5rem_repeat(5,minmax(0,1fr))]"

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="overflow-hidden rounded-lg border bg-white">
        <div className={`${columns} border-b bg-gray-50`}>
          <div className="border-r p-1 text-[10px] font-medium text-gray-600 sm:p-2 sm:text-sm" />
          {dayOrder.map((day) => (
            <div
              key={day}
              className="border-r p-1 text-center text-[11px] font-medium text-gray-600 last:border-r-0 sm:p-2 sm:text-sm"
            >
              <span className="sm:hidden">{dayLabels[day].slice(0, 3)}</span>
              <span className="hidden sm:inline">{dayLabels[day]}</span>
            </div>
          ))}
        </div>

        <div className={`${columns} relative`}>
          <div className="border-r">
            {timeSlots.map((time) => (
              <div
                key={time}
                style={{ height: hourHeight }}
                className="flex items-start border-b p-1 text-[10px] tabular-nums text-gray-500 sm:p-2 sm:text-xs"
              >
                {time}
              </div>
            ))}
          </div>

          {dayOrder.map((day) => (
            <div key={day} className="relative border-r last:border-r-0">
              {timeSlots.map((_, index) => (
                <div key={index} style={{ height: hourHeight }} className="border-b" />
              ))}

              {classEvents[day]?.map((event, eventIndex) => (
                <Tooltip key={`${event.class.id}-${eventIndex}`}>
                  <TooltipTrigger asChild>
                    <div
                      className={`group/class absolute overflow-hidden rounded border p-0.5 leading-tight sm:p-1 ${getClassColor(event.class.course_id)}`}
                      style={getEventStyle(event)}
                    >
                      {onRemoveClass && (
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Remover ${event.class.name}`}
                          className="absolute top-0 right-0 z-10 flex size-5 items-center justify-center bg-transparent p-0 opacity-60 transition-opacity hover:bg-transparent hover:opacity-100"
                          onClick={() => onRemoveClass(event.class.id)}
                          tabIndex={-1}
                        >
                          <X className="size-3.5 text-foreground" />
                        </Button>
                      )}
                      <div className="truncate pr-4 font-mono text-[10px] font-semibold sm:text-xs">
                        {event.class.course_id}
                      </div>
                      <div className="truncate text-[10px] opacity-75 sm:text-xs">
                        {minutesToTime(event.startMinutes)}–
                        {minutesToTime(event.endMinutes)}
                      </div>
                      <div className="text-[10px] leading-tight opacity-75 [overflow-wrap:anywhere] sm:text-xs">
                        {event.class.name}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="max-w-xs bg-background border border-border"
                  >
                    <div className="font-medium text-primary mb-1">
                      {event.class.course_id} - {event.class.name}
                    </div>
                    <div className="mb-1">
                      <span className="text-xs py-0 px-1 h-4 mr-1 border text-foreground rounded border-primary">
                        {event.class.availabilityCode}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono ml-1">
                        {minutesToTime(event.startMinutes)} -{" "}
                        {minutesToTime(event.endMinutes)}
                      </span>
                    </div>
                    <div className="mb-1">
                      <span className="text-xs text-muted-foreground">
                        Docentes:{" "}
                        {event.class.teachers && event.class.teachers.length > 0
                          ? event.class.teachers.join(", ")
                          : "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">
                        Vagas: {event.class.spots}
                      </span>
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
