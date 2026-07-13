import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Grade curricular",
  description:
    "Marque as disciplinas que você já cursou e acompanhe seu progresso na grade curricular da UFMG.",
}

export default function CourseLayout({ children }: { children: React.ReactNode }) {
  return children
}
