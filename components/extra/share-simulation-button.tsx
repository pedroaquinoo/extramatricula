"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Upload as UploadIcon, Check } from "lucide-react"
import { WeeklyPlannerState } from "@/hooks/use-weekly-planner"
import { buildSharePayload, encodeSharePayload } from "@/lib/share"
import { useAppStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface ShareSimulationButtonProps {
  simulationState: WeeklyPlannerState
  semester: number | null
  className?: string
}

export function ShareSimulationButton({
  simulationState,
  semester,
  className,
}: ShareSimulationButtonProps) {
  const { courseId } = useAppStore()
  const [isSharing, setIsSharing] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  const handleShare = async () => {
    if (simulationState.plannedClasses.length === 0) {
      toast.error("Adicione disciplinas antes de compartilhar com amigos")
      return
    }

    if (!courseId) {
      toast.error("Selecione um curso antes de compartilhar")
      return
    }

    setIsSharing(true)
    try {
      const payload = buildSharePayload(
        courseId,
        semester,
        simulationState.plannedClasses.map((cls) => ({
          course_id: cls.course_id,
          availabilityCode: cls.availabilityCode,
        })),
      )
      const encoded = encodeSharePayload(payload)
      const shareUrl = `${window.location.origin}/s#${encoded}`

      await navigator.clipboard.writeText(shareUrl)
      setIsCopied(true)
      toast.success("Link copiado para a área de transferência!")

      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      console.error("Error sharing simulation:", error)
      toast.error("Erro ao compartilhar simulação")
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <Button
      onClick={handleShare}
      disabled={isSharing || simulationState.plannedClasses.length === 0}
      variant="outline"
      size="sm"
      className={cn("gap-2", className)}
    >
      {isCopied ? <Check className="h-4 w-4" /> : <UploadIcon className="h-4 w-4" />}
      {isCopied ? "Copiado!" : "Compartilhar com amigos"}
    </Button>
  )
}
