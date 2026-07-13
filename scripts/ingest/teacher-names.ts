const PARTICLES = new Set(["de", "da", "do", "dos", "das", "e"])

const ALREADY_ANONYMIZED = /^[A-ZÀ-Ú][a-zà-ú]+( [A-Z]\.)+$/

const NUMERIC_ID = /^\d+[A-Z]?$/i

function titleCase(word: string): string {
  if (!word) return word
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
}

export function anonymizeTeacherName(raw: string): string | null {
  const name = raw.trim()
  if (!name || name === "-" || NUMERIC_ID.test(name)) return null
  if (ALREADY_ANONYMIZED.test(name)) return name

  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return null
  if (parts.length === 1) return titleCase(parts[0])

  const first = titleCase(parts[0])
  const initials = parts
    .slice(1)
    .filter((part) => !PARTICLES.has(part.toLowerCase()))
    .map((part) => `${part.charAt(0).toUpperCase()}.`)
    .join(" ")

  return initials ? `${first} ${initials}` : first
}

export function anonymizeTeachers(teachers: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const raw of teachers) {
    const anonymized = anonymizeTeacherName(raw)
    if (anonymized && !seen.has(anonymized)) {
      seen.add(anonymized)
      result.push(anonymized)
    }
  }
  return result
}
