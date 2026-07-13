import offersIndex from "@/data/offers/index.json"
import { getOfferId } from "@/lib/curriculum"
import type { AvailableClass } from "@/hooks/use-available-classes"

// --- Lazy-loaded offers data with caching ---

const offersCache = new Map<string, AvailableClass[]>()
const offersLoadingPromises = new Map<string, Promise<AvailableClass[]>>()

const offerLoaders: Record<string, Record<string, () => Promise<{ default: unknown }>>> = {
  "2026/1": {
    "controle-automacao": () => import("@/data/offers/2026-1/controle-automacao.json"),
  },
  "2026/2": {
    "ciencia-computacao": () => import("@/data/offers/2026-2/ciencia-computacao.json"),
    "controle-automacao": () => import("@/data/offers/2026-2/controle-automacao.json"),
    "eng-aeroespacial": () => import("@/data/offers/2026-2/eng-aeroespacial.json"),
    "eng-agricola-ambiental": () => import("@/data/offers/2026-2/eng-agricola-ambiental.json"),
    "eng-alimentos": () => import("@/data/offers/2026-2/eng-alimentos.json"),
    "eng-ambiental": () => import("@/data/offers/2026-2/eng-ambiental.json"),
    "eng-civil": () => import("@/data/offers/2026-2/eng-civil.json"),
    "eng-computacao": () => import("@/data/offers/2026-2/eng-computacao.json"),
    "eng-eletrica": () => import("@/data/offers/2026-2/eng-eletrica.json"),
    "eng-materiais": () => import("@/data/offers/2026-2/eng-materiais.json"),
    "eng-mecanica": () => import("@/data/offers/2026-2/eng-mecanica.json"),
    "eng-metalurgica": () => import("@/data/offers/2026-2/eng-metalurgica.json"),
    "eng-minas": () => import("@/data/offers/2026-2/eng-minas.json"),
    "eng-producao": () => import("@/data/offers/2026-2/eng-producao.json"),
    "eng-quimica": () => import("@/data/offers/2026-2/eng-quimica.json"),
    "eng-sistemas": () => import("@/data/offers/2026-2/eng-sistemas.json"),
    "estatistica": () => import("@/data/offers/2026-2/estatistica.json"),
    "sistemas-informacao": () => import("@/data/offers/2026-2/sistemas-informacao.json"),
  },
}

function cacheKey(term: string, offerId: string): string {
  return `${term}::${offerId}`
}

export async function loadOffer(term: string, offerId: string): Promise<AvailableClass[]> {
  const key = cacheKey(term, offerId)
  if (offersCache.has(key)) return offersCache.get(key)!

  const loader = offerLoaders[term]?.[offerId]
  if (!loader) return []

  if (!offersLoadingPromises.has(key)) {
    const promise = loader()
      .then((mod) => {
        const data = mod.default as AvailableClass[]
        offersCache.set(key, data)
        offersLoadingPromises.delete(key)
        return data
      })
      .catch(() => {
        offersLoadingPromises.delete(key)
        return [] as AvailableClass[]
      })
    offersLoadingPromises.set(key, promise)
  }

  return offersLoadingPromises.get(key)!
}

export async function loadAllOffersForTerm(term: string): Promise<void> {
  const programs = (offersIndex as { programsByTerm: Record<string, string[]> }).programsByTerm[term]
  if (!programs) return
  await Promise.all(programs.map((offerId) => loadOffer(term, offerId)))
}

export function isOfferLoaded(term: string, offerId: string): boolean {
  return offersCache.has(cacheKey(term, offerId))
}

export function areAllOffersLoadedForTerm(term: string): boolean {
  const programs = (offersIndex as { programsByTerm: Record<string, string[]> }).programsByTerm[term]
  if (!programs) return true
  return programs.every((offerId) => offersCache.has(cacheKey(term, offerId)))
}

// --- Synchronous accessors (require loadOffer to be called first) ---

export function getCurrentOfferTerm(): string {
  return (offersIndex as { current: string }).current
}

export function getOfferTerms(): string[] {
  return (offersIndex as { terms: string[] }).terms
}

export function getOfferForProgram(term: string, courseId: string): AvailableClass[] {
  if (!courseId) return []
  const offerId = getOfferId(courseId)
  return offersCache.get(cacheKey(term, offerId)) ?? []
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

export function findTurmasAcrossOffers(
  term: string,
  disciplineCode: string,
): TurmaAcrossOffers[] {
  const byAvailabilityCode = new Map<string, TurmaAcrossOffers>()

  const programs = (offersIndex as { programsByTerm: Record<string, string[]> }).programsByTerm[term] ?? []

  for (const offerId of programs) {
    const key = cacheKey(term, offerId)
    const classes = offersCache.get(key)
    if (!classes) continue

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
