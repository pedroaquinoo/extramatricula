import { ChevronDown } from "lucide-react"

export default function ClassDetailPreview() {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center gap-3 p-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">ELE078</span>
            <span className="truncate text-sm text-muted-foreground">
              Sistemas de Controle
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="rounded border px-1.5 py-0.5 text-[10px] text-muted-foreground">
              4 créditos
            </span>
            <span className="rounded border px-1.5 py-0.5 text-[10px] text-muted-foreground">
              6º período
            </span>
            <span className="rounded border border-primary/40 bg-primary/5 px-1.5 py-0.5 text-[10px] text-primary">
              Obrigatória
            </span>
          </div>
        </div>
        <ChevronDown className="size-4 shrink-0 rotate-180 text-muted-foreground" />
      </div>

      <div className="flex flex-col gap-4 border-t bg-muted/40 p-4 text-sm">
        <div>
          <p className="text-xs font-medium">Pré-requisitos</p>
          <ul className="mt-1.5 ml-4 list-disc space-y-1 text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">MAT039</span> · Equações
              Diferenciais
            </li>
            <li>
              <span className="font-medium text-foreground">EEE014</span> · Análise de
              Sinais e Sistemas
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-medium">Desbloqueios</p>
          <ul className="mt-1.5 ml-4 list-disc space-y-1 text-muted-foreground">
            <li>
              <span className="font-medium text-primary">ELE079</span> · Sistemas de
              Controle Digital
            </li>
            <li>
              <span className="font-medium text-primary">ELE088</span> · Controle
              Multivariável
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-medium">Descrição</p>
          <p className="mt-1.5 text-muted-foreground">
            Modelagem de sistemas dinâmicos. Resposta no tempo e na frequência.
            Estabilidade. Lugar das raízes. Projeto de controladores PID e compensadores.
            Análise de desempenho em malha fechada.
          </p>
        </div>
      </div>
    </div>
  )
}
