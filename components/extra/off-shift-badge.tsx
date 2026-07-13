import { Badge } from "@/components/ui/badge"

export function OffShiftBadge({ className }: { className?: string }) {
  return (
    <Badge
      variant="outline"
      className={`gap-1 px-1.5 py-0 text-[10px] leading-4 [&>svg]:size-2.5 border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 ${className ?? ""}`}
      title="As vagas desta turma podem não ser ofertadas ao seu turno."
    >
      Pode não ser do seu turno
    </Badge>
  )
}
