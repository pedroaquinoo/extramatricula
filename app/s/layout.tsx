import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Grade compartilhada",
  description: "Visualize uma grade semanal compartilhada no Extramatrícula.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function SharedScheduleLayout({ children }: { children: React.ReactNode }) {
  return children
}
