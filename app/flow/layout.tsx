import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Fluxograma de pré-requisitos",
  description:
    "Visualize a grade curricular como fluxograma e veja quais disciplinas estão liberadas ou trancadas.",
}

export default function FlowLayout({ children }: { children: React.ReactNode }) {
  return children
}
