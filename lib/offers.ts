import offersIndex from "@/data/offers/index.json"
import offer20261ControleAutomacao from "@/data/offers/2026-1/controle-automacao.json"
import offer20262CienciaComputacao from "@/data/offers/2026-2/ciencia-computacao.json"
import offer20262ControleAutomacao from "@/data/offers/2026-2/controle-automacao.json"
import offer20262EngAeroespacial from "@/data/offers/2026-2/eng-aeroespacial.json"
import offer20262EngAgricolaAmbiental from "@/data/offers/2026-2/eng-agricola-ambiental.json"
import offer20262EngAlimentos from "@/data/offers/2026-2/eng-alimentos.json"
import offer20262EngAmbiental from "@/data/offers/2026-2/eng-ambiental.json"
import offer20262EngCivil from "@/data/offers/2026-2/eng-civil.json"
import offer20262EngComputacao from "@/data/offers/2026-2/eng-computacao.json"
import offer20262EngEletrica from "@/data/offers/2026-2/eng-eletrica.json"
import offer20262EngMateriais from "@/data/offers/2026-2/eng-materiais.json"
import offer20262EngMecanica from "@/data/offers/2026-2/eng-mecanica.json"
import offer20262EngMetalurgica from "@/data/offers/2026-2/eng-metalurgica.json"
import offer20262EngMinas from "@/data/offers/2026-2/eng-minas.json"
import offer20262EngProducao from "@/data/offers/2026-2/eng-producao.json"
import offer20262EngQuimica from "@/data/offers/2026-2/eng-quimica.json"
import offer20262EngSistemas from "@/data/offers/2026-2/eng-sistemas.json"
import offer20262Estatistica from "@/data/offers/2026-2/estatistica.json"
import offer20262SistemasInformacao from "@/data/offers/2026-2/sistemas-informacao.json"
import { getOfferId } from "@/lib/curriculum"
import type { AvailableClass } from "@/hooks/use-available-classes"

const offersByTermAndOfferId: Record<string, Record<string, AvailableClass[]>> = {
  "2026/1": {
    "controle-automacao": offer20261ControleAutomacao as AvailableClass[],
  },
  "2026/2": {
    "ciencia-computacao": offer20262CienciaComputacao as AvailableClass[],
    "controle-automacao": offer20262ControleAutomacao as AvailableClass[],
    "eng-aeroespacial": offer20262EngAeroespacial as AvailableClass[],
    "eng-agricola-ambiental": offer20262EngAgricolaAmbiental as AvailableClass[],
    "eng-alimentos": offer20262EngAlimentos as AvailableClass[],
    "eng-ambiental": offer20262EngAmbiental as AvailableClass[],
    "eng-civil": offer20262EngCivil as AvailableClass[],
    "eng-computacao": offer20262EngComputacao as AvailableClass[],
    "eng-eletrica": offer20262EngEletrica as AvailableClass[],
    "eng-materiais": offer20262EngMateriais as AvailableClass[],
    "eng-mecanica": offer20262EngMecanica as AvailableClass[],
    "eng-metalurgica": offer20262EngMetalurgica as AvailableClass[],
    "eng-minas": offer20262EngMinas as AvailableClass[],
    "eng-producao": offer20262EngProducao as AvailableClass[],
    "eng-quimica": offer20262EngQuimica as AvailableClass[],
    "eng-sistemas": offer20262EngSistemas as AvailableClass[],
    "estatistica": offer20262Estatistica as AvailableClass[],
    "sistemas-informacao": offer20262SistemasInformacao as AvailableClass[],
  },
}

export function getCurrentOfferTerm(): string {
  return offersIndex.current
}

export function getOfferTerms(): string[] {
  return offersIndex.terms
}

export function getOfferForProgram(term: string, courseId: string): AvailableClass[] {
  if (!courseId) return []
  const offerId = getOfferId(courseId)
  return offersByTermAndOfferId[term]?.[offerId] ?? []
}

export function getCurrentOfferForProgram(courseId: string): AvailableClass[] {
  return getOfferForProgram(getCurrentOfferTerm(), courseId)
}

export function findTurma(
  term: string,
  courseId: string,
  disciplineCode: string,
  availabilityCode: string,
): AvailableClass | undefined {
  return getOfferForProgram(term, courseId).find(
    (cls) =>
      cls.course_id === disciplineCode && cls.availabilityCode === availabilityCode,
  )
}

export type TurmaAcrossOffers = AvailableClass & { offerIds: string[] }

// Collects every turma of a discipline across all program offers in a term,
// deduplicating by availability code and tracking which offers list each one.
export function findTurmasAcrossOffers(
  term: string,
  disciplineCode: string,
): TurmaAcrossOffers[] {
  const byAvailabilityCode = new Map<string, TurmaAcrossOffers>()

  for (const [offerId, classes] of Object.entries(offersByTermAndOfferId[term] ?? {})) {
    for (const cls of classes) {
      if (cls.course_id !== disciplineCode) continue
      const existing = byAvailabilityCode.get(cls.availabilityCode)
      if (existing) {
        if (!existing.offerIds.includes(offerId)) existing.offerIds.push(offerId)
      } else {
        byAvailabilityCode.set(cls.availabilityCode, { ...cls, offerIds: [offerId] })
      }
    }
  }

  return Array.from(byAvailabilityCode.values())
}

