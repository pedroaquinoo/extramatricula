"use client"

import React, { useMemo, useState, useCallback } from "react"
import {
  ReactFlow,
  Background,
  MiniMap,
  Position,
  Node,
  Edge,
  NodeProps,
  BackgroundVariant,
  Handle,
  Controls,
  NodeMouseHandler,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { useCourseData } from "@/hooks/use-course-data"
import type { Class, ClassWithPrerequisites } from "@/lib/types/curriculum"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CourseChip } from "@/components/extra/course-chip"
import { SetupPrompt } from "@/components/extra/setup-dialog"
import { LoadingScreen } from "@/components/extra/loading-screen"

const NODE_WIDTH = 250
const NODE_HEIGHT = 100
const X_GAP = 300
const Y_GAP = 200
const SEMESTER_LABEL_SIZE = 80
const SEMESTER_LABEL_MARGIN = 50
const EDGE_COLORS = [
  "#ef4444",
  "#f59e42",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f43f5e",
  "#a3e635",
]

type ViewMode = "reference" | "user"

function getLockedStatus(
  classItem: ClassWithPrerequisites,
  passedCodes: Set<string>,
): boolean {
  if (!classItem.prerequisites || classItem.prerequisites.length === 0) return false
  return !classItem.prerequisites.every((pr) => passedCodes.has(pr.code))
}

function getSemesterGroups(
  classes: ClassWithPrerequisites[],
): Record<number, ClassWithPrerequisites[]> {
  const groups: Record<number, ClassWithPrerequisites[]> = {}
  classes.forEach((cls) => {
    const sem = cls.ref_period || 1
    if (!groups[sem]) groups[sem] = []
    groups[sem].push(cls)
  })
  return groups
}

function SemesterLabelNode({ data }: NodeProps) {
  const { semester } = data as { semester: number }
  return (
    <div
      style={{
        width: SEMESTER_LABEL_SIZE,
        height: SEMESTER_LABEL_SIZE,
        backgroundColor: "#3b82f6",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 8,
        fontSize: 24,
        fontWeight: 700,
        boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
        border: "2px solid white",
      }}
    >
      {semester}
    </div>
  )
}

function ClassNode({ data }: NodeProps) {
  const { code, name, locked, hours, refPeriod, viewMode, isHighlighted, isSelected } =
    data as {
      code: string
      name: string
      locked: boolean
      hours: number
      refPeriod?: number
      viewMode: ViewMode
      isHighlighted: boolean
      isSelected: boolean
    }

  return (
    <div
      style={{
        border: isSelected
          ? "3px solid #3b82f6"
          : locked
            ? "2px dashed #d1d5db"
            : "2px solid #111827",
        background: locked ? "#f3f4f6" : "#fff",
        color: "#111827",
        borderRadius: 12,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        boxSizing: "border-box",
        padding: 16,
        boxShadow: isSelected
          ? "0 0 0 4px rgba(59, 130, 246, 0.2)"
          : locked
            ? "none"
            : "0 2px 8px rgba(0,0,0,0.1)",
        fontSize: 14,
        textAlign: "center",
        lineHeight: 1.4,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        cursor: "pointer",
        opacity: isHighlighted ? 1 : 0.3,
        transition: "all 0.2s ease",
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{
          top: -8,
          width: 16,
          height: 16,
          background: "#6b7280",
          border: "2px solid #fff",
          opacity: 0,
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          bottom: -8,
          width: 16,
          height: 16,
          background: "#6b7280",
          border: "2px solid #fff",
          opacity: 0,
        }}
      />
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4, color: "#111827" }}>
        {code}
      </div>
      <div
        style={{
          fontWeight: 500,
          marginBottom: 8,
          fontSize: 13,
          textAlign: "center",
          lineHeight: 1.2,
          maxHeight: "36px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "wrap",
        }}
      >
        {name}
      </div>
      <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#6b7280" }}>
        <span>{hours}h</span>
        {viewMode === "user" && refPeriod && <span>S{refPeriod}</span>}
      </div>
    </div>
  )
}

export default function TreePage() {
  const [viewMode, setViewMode] = useState<ViewMode>("user")
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const { courseId, classes, passedSet, hasData } = useCourseData()

  const passedCodes = useMemo(() => {
    if (viewMode === "reference") return new Set<string>()
    return passedSet
  }, [passedSet, viewMode])

  const dependencyMap = useMemo(() => {
    const map: Record<string, string[]> = {}
    for (const cls of classes) {
      if (cls.prerequisites && cls.prerequisites.length > 0) {
        for (const prereq of cls.prerequisites as Class[]) {
          if (!map[prereq.code]) map[prereq.code] = []
          map[prereq.code].push(cls.code)
        }
      }
    }
    return map
  }, [classes])

  const getUnlockedClasses = useCallback(
    (classCode: string): Set<string> => {
      const unlocked = new Set<string>()
      const visited = new Set<string>()
      const traverse = (code: string) => {
        if (visited.has(code)) return
        visited.add(code)
        const directDependents = dependencyMap[code] || []
        for (const dependentCode of directDependents) {
          unlocked.add(dependentCode)
          traverse(dependentCode)
        }
      }
      traverse(classCode)
      return unlocked
    },
    [dependencyMap],
  )

  const highlightedClasses = useMemo(() => {
    if (!selectedNodeId) return new Set<string>()
    const unlocked = getUnlockedClasses(selectedNodeId)
    unlocked.add(selectedNodeId)
    return unlocked
  }, [selectedNodeId, getUnlockedClasses])

  const semesterGroups = useMemo(() => getSemesterGroups(classes), [classes])

  const semesters = useMemo((): number[] => {
    if (!Object.keys(semesterGroups).length) return []
    return Object.keys(semesterGroups)
      .map(Number)
      .sort((a, b) => a - b)
  }, [semesterGroups])

  const nodePositions = useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {}
    if (!semesters.length) return positions
    semesters.forEach((sem: number, semIdx: number) => {
      const group = (semesterGroups[sem] || [])
        .slice()
        .sort((a, b) => a.code.localeCompare(b.code))
      const startX = SEMESTER_LABEL_SIZE + SEMESTER_LABEL_MARGIN
      group.forEach((cls, idx) => {
        positions[cls.code] = {
          x: startX + idx * X_GAP,
          y: semIdx * Y_GAP,
        }
      })
    })
    return positions
  }, [semesters, semesterGroups])

  const edgeColorMap = useMemo(() => {
    const colorMap: Record<string, string> = {}
    let colorIdx = 0
    for (const cls of classes) {
      if (cls.prerequisites && cls.prerequisites.length > 0) {
        for (const pr of cls.prerequisites as Class[]) {
          const edgeId = `${pr.code}->${cls.code}`
          colorMap[edgeId] = EDGE_COLORS[colorIdx % EDGE_COLORS.length]
          colorIdx++
        }
      }
    }
    return colorMap
  }, [classes])

  const nodes: Node[] = useMemo(() => {
    const classNodes = classes.map((cls) => {
      const locked = viewMode === "user" ? getLockedStatus(cls, passedCodes) : false
      const hours = cls.credits * 15
      const isSelected = selectedNodeId === cls.code
      const isHighlighted = selectedNodeId === null || highlightedClasses.has(cls.code)
      return {
        id: cls.code,
        type: "classNode",
        data: {
          code: cls.code,
          name: cls.name,
          locked,
          hours,
          refPeriod: cls.ref_period,
          viewMode,
          isHighlighted,
          isSelected,
        },
        position: nodePositions[cls.code] || { x: 0, y: 0 },
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        draggable: true,
        selectable: true,
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      } as Node
    })

    const semesterLabelNodes = semesters.map((sem, semIdx) => ({
      id: `semester-label-${sem}`,
      type: "semesterLabel",
      data: { semester: sem },
      position: {
        x: 0,
        y: semIdx * Y_GAP + (NODE_HEIGHT - SEMESTER_LABEL_SIZE) / 2,
      },
      width: SEMESTER_LABEL_SIZE,
      height: SEMESTER_LABEL_SIZE,
      draggable: false,
      selectable: false,
    }))

    return [...semesterLabelNodes, ...classNodes]
  }, [
    classes,
    passedCodes,
    nodePositions,
    viewMode,
    selectedNodeId,
    highlightedClasses,
    semesters,
  ])

  const edges: Edge[] = useMemo(() => {
    const result: Edge[] = []
    for (const cls of classes) {
      if (cls.prerequisites && cls.prerequisites.length > 0) {
        for (const prereq of cls.prerequisites as Class[]) {
          const edgeId = `${prereq.code}->${cls.code}`
          const edgeColor = edgeColorMap[edgeId] || "#9ca3af"
          const isHighlighted =
            selectedNodeId === null ||
            (highlightedClasses.has(prereq.code) && highlightedClasses.has(cls.code))
          const isSelectedPath =
            selectedNodeId !== null &&
            highlightedClasses.has(prereq.code) &&
            highlightedClasses.has(cls.code)
          result.push({
            id: edgeId,
            source: prereq.code,
            target: cls.code,
            type: "smoothstep",
            animated: isSelectedPath,
            style: {
              stroke: edgeColor,
              strokeWidth: isSelectedPath ? 5 : isHighlighted ? 3 : 2,
              strokeDasharray: "0",
              opacity: isHighlighted ? 1 : 0.15,
              filter: isSelectedPath
                ? "drop-shadow(0 0 6px rgba(59, 130, 246, 0.4))"
                : "none",
            },
            markerEnd: {
              type: "arrowclosed",
              color: edgeColor,
              width: isSelectedPath ? 22 : 20,
              height: isSelectedPath ? 22 : 20,
            },
            selectable: false,
          } as Edge)
        }
      }
    }
    return result
  }, [classes, edgeColorMap, selectedNodeId, highlightedClasses])

  const onNodeClick: NodeMouseHandler = useCallback(
    (event, node) => {
      event.stopPropagation()
      if (node.type === "classNode") {
        setSelectedNodeId(selectedNodeId === node.id ? null : node.id)
      }
    },
    [selectedNodeId],
  )

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null)
  }, [])

  if (!courseId) {
    return <SetupPrompt />
  }

  if (!hasData) {
    return <LoadingScreen className="p-4" />
  }

  const selected = selectedNodeId
    ? classes.find((cls) => cls.code === selectedNodeId)
    : undefined

  return (
    <div className="flex h-full flex-col">
      <header className="z-10 shrink-0 border-b bg-background px-4 py-3">
        <div className="mx-auto flex max-w-7xl flex-col gap-2">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="font-semibold">Fluxograma</h1>
              <CourseChip className="mt-0.5" />
            </div>
          </div>

          <Tabs
            value={viewMode}
            onValueChange={(value) => setViewMode(value as ViewMode)}
          >
            <TabsList className="w-full sm:w-fit">
              <TabsTrigger value="user" className="flex-1 sm:flex-none">
                Minhas disciplinas
              </TabsTrigger>
              <TabsTrigger value="reference" className="flex-1 sm:flex-none">
                Grade de referência
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      <div className="relative min-h-0 flex-1 bg-[#f9fafb]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={{
            classNode: ClassNode,
            semesterLabel: SemesterLabelNode,
          }}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          panOnDrag={true}
          zoomOnScroll={true}
          zoomOnPinch={true}
          nodesDraggable={true}
          nodesConnectable={false}
          elementsSelectable={false}
          selectionOnDrag={false}
          panOnScroll={false}
          minZoom={0.1}
          maxZoom={2}
          proOptions={{ hideAttribution: false }}
        >
          <Controls
            showInteractive={false}
            className="!bottom-4 !left-4 !hidden sm:!flex"
          />
          <MiniMap
            nodeColor={(n) => {
              if (n.type === "semesterLabel") return "#3b82f6"
              return n.data.locked ? "#d1d5db" : "#111827"
            }}
            zoomable={false}
            pannable={false}
            // Out of the bottom-right corner: that is where the context bar lives now.
            className="!top-4 !right-4 !bottom-auto !hidden sm:!block"
            style={{ backgroundColor: "#f8f8f8" }}
          />
          <Background gap={32} color="#e5e7eb" variant={BackgroundVariant.Lines} />
        </ReactFlow>

        {/* On a phone the graph fills the screen, so the context that used to sit in the
            header rides along the bottom instead, above the tab bar, out of the way. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3">
          <div className="pointer-events-auto mx-auto max-w-md rounded-xl border bg-background/95 px-3 py-2 shadow-sm backdrop-blur sm:max-w-lg">
            {selected ? (
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{selected.name}</p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-mono">{selected.code}</span> ·{" "}
                    {selected.ref_period}° período · {highlightedClasses.size - 1}{" "}
                    disciplina
                    {highlightedClasses.size - 1 === 1 ? "" : "s"} desbloqueada
                    {highlightedClasses.size - 1 === 1 ? "" : "s"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedNodeId(null)}
                  className="shrink-0 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  Limpar
                </button>
              </div>
            ) : (
              <p className="text-center text-xs text-pretty text-muted-foreground">
                {viewMode === "user"
                  ? "Trancadas são as que dependem do que você ainda não cursou. Toque numa disciplina para ver o que ela desbloqueia."
                  : "Grade oficial por período de referência. Toque numa disciplina para ver o que ela desbloqueia."}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
