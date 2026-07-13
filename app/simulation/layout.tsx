import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Simulação de horários",
  description:
    "Monte sua grade semanal com as turmas em oferta e identifique choques de horário antes da matrícula.",
}

export default function SimulationLayout({ children }: { children: React.ReactNode }) {
  return children
}
