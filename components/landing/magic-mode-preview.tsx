import { Sparkles, CalendarDays, Clock, ExternalLink } from "lucide-react"

const options = [
  {
    label: "Opção 1",
    days: "2 dias",
    idle: "sem lacunas",
    codes: ["MAT001", "ELE078", "EEE014"],
    meta: "180h · 3 disciplinas",
  },
  {
    label: "Opção 2",
    days: "3 dias",
    idle: "lacunas de 1h",
    codes: ["MAT001", "ELE079", "EEE075", "ECA003"],
    meta: "240h · 4 disciplinas",
  },
]

export default function MagicModePreview() {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center gap-2 border-b p-4">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Sparkles className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium">2 melhores grades</p>
          <p className="text-xs text-muted-foreground">menos dias na UFMG</p>
        </div>
      </div>

      <div className="grid gap-2 bg-muted/40 p-4 sm:grid-cols-2">
        {options.map((option) => (
          <div
            key={option.label}
            className="flex flex-col gap-2 rounded-lg border bg-card p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">{option.label}</span>
              <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CalendarDays className="size-3.5" />
                {option.days}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" />
                {option.idle}
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {option.codes.map((code) => (
                <span
                  key={code}
                  className="rounded border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                >
                  {code}
                </span>
              ))}
            </div>
            <span className="text-xs tabular-nums text-muted-foreground">
              {option.meta}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
