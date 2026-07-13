"use client"

import { useState } from "react"
import { Check, Plus, Users } from "lucide-react"

const dayLabels = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"]
const dayShort = ["Seg", "Ter", "Qua", "Qui", "Sex"]

const START_HOUR = 7
const HOURS = [7, 8, 9, 10, 11]

type Meeting = {
  day: number
  start: string
  end: string
}

type Course = {
  code: string
  name: string
  shortName: string
  turma: string
  schedule: string
  spots: number
  color: string
  meetings: Meeting[]
}

/** Turmas reais da oferta, copiadas de data/offers/. Estáticas: a landing não lê o JSON. */
const courses: Course[] = [
  {
    code: "ELT040",
    name: "Eletrônica de Potência",
    shortName: "ELETRÔNICA DE POTÊNCIA",
    turma: "TECAE",
    schedule: "Seg e Qua · 07:30–09:10",
    spots: 30,
    color: "bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200",
    meetings: [
      { day: 0, start: "07:30", end: "09:10" },
      { day: 2, start: "07:30", end: "09:10" },
    ],
  },
  {
    code: "DCC011",
    name: "Introdução a Banco de Dados",
    shortName: "INTRODUÇÃO A BANCO DE DADOS",
    turma: "TB",
    schedule: "Seg e Qua · 09:25–11:05",
    spots: 65,
    color: "bg-purple-100 border-purple-300 text-purple-800 hover:bg-purple-200",
    meetings: [
      { day: 0, start: "09:25", end: "11:05" },
      { day: 2, start: "09:25", end: "11:05" },
    ],
  },
  {
    code: "ELE045",
    name: "Geração de Energia Elétrica",
    shortName: "GERAÇÃO DE ENERGIA",
    turma: "TTTB",
    schedule: "Ter e Qui · 09:25–11:05",
    spots: 55,
    color: "bg-green-100 border-green-300 text-green-800 hover:bg-green-200",
    meetings: [
      { day: 1, start: "09:25", end: "11:05" },
      { day: 3, start: "09:25", end: "11:05" },
    ],
  },
  {
    code: "ENG075",
    name: "Tópicos: Redes de Comunicação",
    shortName: "TÓPICOS: REDES",
    turma: "T036",
    schedule: "Qua e Sex · 07:30–09:10",
    spots: 5,
    color: "bg-orange-100 border-orange-300 text-orange-800 hover:bg-orange-200",
    meetings: [
      { day: 2, start: "07:30", end: "09:10" },
      { day: 4, start: "07:30", end: "09:10" },
    ],
  },
]

const defaultSelected = ["ELT040", "DCC011", "ELE045"]

function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

function offset(time: string) {
  return toMinutes(time) - START_HOUR * 60
}

type PlacedBlock = {
  course: Course
  meeting: Meeting
  lane: number
  lanes: number
}

/** Lays out a day's meetings into lanes so overlapping classes sit side by side. */
function layoutDay(selected: Course[], day: number): PlacedBlock[] {
  const meetings = selected
    .flatMap((course) =>
      course.meetings
        .filter((m) => m.day === day)
        .map((meeting) => ({ course, meeting })),
    )
    .sort((a, b) => toMinutes(a.meeting.start) - toMinutes(b.meeting.start))

  const placed: PlacedBlock[] = []
  let group: PlacedBlock[] = []
  let groupEnd = -1

  const flush = () => {
    const lanes = group.reduce((max, b) => Math.max(max, b.lane + 1), 0)
    for (const block of group) block.lanes = lanes
    placed.push(...group)
    group = []
  }

  for (const { course, meeting } of meetings) {
    if (toMinutes(meeting.start) >= groupEnd) flush()

    const taken = new Set(
      group
        .filter((b) => toMinutes(b.meeting.end) > toMinutes(meeting.start))
        .map((b) => b.lane),
    )
    let lane = 0
    while (taken.has(lane)) lane++

    group.push({ course, meeting, lane, lanes: 1 })
    groupEnd = Math.max(groupEnd, toMinutes(meeting.end))
  }
  flush()

  return placed
}

export default function SchedulePreview() {
  const [selected, setSelected] = useState<string[]>(defaultSelected)

  const toggle = (code: string) =>
    setSelected((current) =>
      current.includes(code) ? current.filter((c) => c !== code) : [...current, code],
    )

  const selectedCourses = courses.filter((c) => selected.includes(c.code))

  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {/* Turmas em oferta */}
      <div className="order-2 rounded-xl border bg-card p-3 lg:order-1">
        <p className="px-1 pb-2 text-xs font-medium text-muted-foreground">
          Turmas em oferta · 2026/1
        </p>
        <ul className="space-y-1.5">
          {courses.map((course) => {
            const added = selected.includes(course.code)
            return (
              <li key={course.code}>
                <button
                  type="button"
                  onClick={() => toggle(course.code)}
                  aria-pressed={added}
                  className={`flex w-full items-center gap-2 rounded-lg border p-2 text-left transition-colors ${
                    added
                      ? "border-primary/30 bg-primary/5 hover:bg-primary/10"
                      : "bg-background hover:bg-muted/60"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold">{course.code}</span>
                      <span className="rounded border border-primary/40 px-1 text-[10px] leading-4 text-muted-foreground">
                        {course.turma}
                      </span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {course.name}
                    </p>
                    <p className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span>{course.schedule}</span>
                      <span className="flex items-center gap-0.5">
                        <Users className="size-2.5" />
                        {course.spots}
                      </span>
                    </p>
                  </div>
                  <span
                    className={`flex size-6 shrink-0 items-center justify-center rounded-md border transition-colors ${
                      added
                        ? "border-primary bg-primary text-primary-foreground"
                        : "text-muted-foreground"
                    }`}
                    aria-hidden
                  >
                    {added ? (
                      <Check className="size-3.5" />
                    ) : (
                      <Plus className="size-3.5" />
                    )}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Grade semanal */}
      <div className="order-1 min-w-0 overflow-hidden rounded-xl border bg-card lg:order-2 lg:col-span-2">
        <div className="grid grid-cols-[34px_repeat(5,minmax(0,1fr))] border-b bg-muted/50 sm:grid-cols-[46px_repeat(5,minmax(0,1fr))]">
          <div className="border-r p-1.5 text-[10px] font-medium text-muted-foreground">
            <span className="hidden sm:inline">Horário</span>
          </div>
          {dayLabels.map((day, i) => (
            <div
              key={day}
              className="border-r p-1.5 text-center text-[10px] font-medium text-muted-foreground last:border-r-0"
            >
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{dayShort[i]}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-[34px_repeat(5,minmax(0,1fr))] sm:grid-cols-[46px_repeat(5,minmax(0,1fr))]">
          <div className="border-r">
            {HOURS.map((h) => (
              <div
                key={h}
                className="flex h-[60px] items-start border-b p-1 text-[9px] text-muted-foreground last:border-b-0 sm:text-[10px]"
              >
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {dayLabels.map((day, dayIndex) => (
            <div key={day} className="relative border-r last:border-r-0">
              {HOURS.map((h) => (
                <div key={h} className="h-[60px] border-b last:border-b-0" />
              ))}

              {layoutDay(selectedCourses, dayIndex).map(
                ({ course, meeting, lane, lanes }) => (
                  <button
                    key={`${course.code}-${meeting.day}`}
                    type="button"
                    onClick={() => toggle(course.code)}
                    title={`Remover ${course.code}`}
                    className={`absolute overflow-hidden rounded border px-1 py-0.5 text-left transition-colors ${course.color}`}
                    style={{
                      top: `${offset(meeting.start)}px`,
                      height: `${offset(meeting.end) - offset(meeting.start)}px`,
                      left: `calc(${(lane / lanes) * 100}% + 2px)`,
                      width: `calc(${100 / lanes}% - 4px)`,
                    }}
                  >
                    <p className="truncate text-[9px] font-medium leading-tight sm:text-[10px]">
                      {course.code}
                    </p>
                    {lanes === 1 && (
                      <p className="hidden truncate text-[9px] leading-tight opacity-80 sm:block">
                        {course.shortName}
                      </p>
                    )}
                    <p className="mt-0.5 truncate text-[8px] leading-tight opacity-75 sm:text-[9px]">
                      {meeting.start}
                      {lanes === 1 && (
                        <span className="hidden sm:inline">–{meeting.end}</span>
                      )}
                    </p>
                  </button>
                ),
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
