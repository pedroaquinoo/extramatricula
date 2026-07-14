import offersIndexData from "@/data/offers/index.json"
import { getOfferId } from "@/lib/curriculum"
import type { AvailableClass } from "@/hooks/use-available-classes"

const offersIndex = offersIndexData as {
  current: string
  terms: string[]
  programsByTerm?: Record<string, string[]>
}

const offerLoaders: Record<string, () => Promise<{ default: AvailableClass[] }>> = {
  "2026/1:controle-automacao": () =>
    import("@/data/offers/2026-1/controle-automacao.json"),
  "2026/2:ciencia-computacao": () =>
    import("@/data/offers/2026-2/ciencia-computacao.json"),
  "2026/2:ciencias-contabeis": () =>
    import("@/data/offers/2026-2/ciencias-contabeis.json"),
  "2026/2:ciencias-economicas": () =>
    import("@/data/offers/2026-2/ciencias-economicas.json"),
  "2026/2:controladoria-financas": () =>
    import("@/data/offers/2026-2/controladoria-financas.json"),
  "2026/2:controle-automacao": () =>
    import("@/data/offers/2026-2/controle-automacao.json"),
  "2026/2:direito": () =>
    import("@/data/offers/2026-2/direito.json"),
  "2026/2:eng-aeroespacial": () =>
    import("@/data/offers/2026-2/eng-aeroespacial.json"),
  "2026/2:eng-agricola-ambiental": () =>
    import("@/data/offers/2026-2/eng-agricola-ambiental.json"),
  "2026/2:eng-alimentos": () =>
    import("@/data/offers/2026-2/eng-alimentos.json"),
  "2026/2:eng-ambiental": () =>
    import("@/data/offers/2026-2/eng-ambiental.json"),
  "2026/2:eng-civil": () =>
    import("@/data/offers/2026-2/eng-civil.json"),
  "2026/2:eng-computacao": () =>
    import("@/data/offers/2026-2/eng-computacao.json"),
  "2026/2:eng-eletrica": () =>
    import("@/data/offers/2026-2/eng-eletrica.json"),
  "2026/2:eng-materiais": () =>
    import("@/data/offers/2026-2/eng-materiais.json"),
  "2026/2:eng-mecanica": () =>
    import("@/data/offers/2026-2/eng-mecanica.json"),
  "2026/2:eng-metalurgica": () =>
    import("@/data/offers/2026-2/eng-metalurgica.json"),
  "2026/2:eng-minas": () =>
    import("@/data/offers/2026-2/eng-minas.json"),
  "2026/2:eng-producao": () =>
    import("@/data/offers/2026-2/eng-producao.json"),
  "2026/2:eng-quimica": () =>
    import("@/data/offers/2026-2/eng-quimica.json"),
  "2026/2:eng-sistemas": () =>
    import("@/data/offers/2026-2/eng-sistemas.json"),
  "2026/2:estatistica": () =>
    import("@/data/offers/2026-2/estatistica.json"),
  "2026/2:sistemas-informacao": () =>
    import("@/data/offers/2026-2/sistemas-informacao.json"),
}

const offerCache = new Map<string, AvailableClass[]>()
const offerLoading = new Map<string, Promise<AvailableClass[]>>()
const termLoading = new Map<string, Promise<void>>()

function offerKey(term: string, offerId: string): string {
  return `${term}:${offerId}`
}

export function isOfferLoaded(term: string, offerId: string): boolean {
  return offerCache.has(offerKey(term, offerId))
}

export async function loadOffer(term: string, offerId: string): Promise<AvailableClass[]> {
  const key = offerKey(term, offerId)
  const cached = offerCache.get(key)
  if (cached) return cached

  const inFlight = offerLoading.get(key)
  if (inFlight) return inFlight

  const loader = offerLoaders[key]
  if (!loader) return []

  const promise = loader()
    .then((module) => {
      const data = module.default
      offerCache.set(key, data)
      return data
    })
    .catch(() => [] as AvailableClass[])
    .finally(() => {
      offerLoading.delete(key)
    })

  offerLoading.set(key, promise)
  return promise
}

export async function loadTermOffers(term: string): Promise<void> {
  const programs = offersIndex.programsByTerm?.[term] ?? []
  if (programs.length === 0) return

  const inFlight = termLoading.get(term)
  if (inFlight) return inFlight

  const promise = Promise.all(programs.map((offerId) => loadOffer(term, offerId))).then(
    () => undefined,
  )
  termLoading.set(term, promise)
  await promise
  termLoading.delete(term)
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
  return offerCache.get(offerKey(term, offerId)) ?? []
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

export async function findTurmasAcrossOffers(
  term: string,
  disciplineCode: string,
): Promise<TurmaAcrossOffers[]> {
  await loadTermOffers(term)

  const byAvailabilityCode = new Map<string, TurmaAcrossOffers>()
  const programs = offersIndex.programsByTerm?.[term] ?? []

  for (const offerId of programs) {
    const classes = offerCache.get(offerKey(term, offerId)) ?? []
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

