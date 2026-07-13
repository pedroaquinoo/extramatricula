import { mkdir, readFile, writeFile } from "fs/promises"
import path from "path"
import { parseCurriculumPdfFile } from "./parse-curriculum-pdf"
import { syncCurriculumLib } from "./update-lib-imports"

const ROOT = process.cwd()
const CURRICULUM_DIR = path.join(ROOT, "data", "curriculum")
const CURRICULUM_INDEX = path.join(CURRICULUM_DIR, "index.json")

interface CourseIndexEntry {
  id: string
  name: string
  offerId?: string
  shift?: "diurno" | "noturno"
}

function parseArgs(argv: string[]) {
  const positional: string[] = []
  let offerId: string | undefined
  let nameOverride: string | undefined

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === "--offer-id") {
      offerId = argv[++i]
      continue
    }
    if (arg === "--name") {
      nameOverride = argv[++i]
      continue
    }
    positional.push(arg)
  }

  return { positional, offerId, nameOverride }
}

async function readCurriculumIndex(): Promise<CourseIndexEntry[]> {
  const raw = await readFile(CURRICULUM_INDEX, "utf8")
  return JSON.parse(raw) as CourseIndexEntry[]
}

async function writeCurriculumIndex(courses: CourseIndexEntry[]) {
  await mkdir(CURRICULUM_DIR, { recursive: true })
  await writeFile(CURRICULUM_INDEX, JSON.stringify(courses, null, 2) + "\n")
}

async function main() {
  const { positional, offerId, nameOverride } = parseArgs(process.argv.slice(2))
  const [courseId, source] = positional

  if (!courseId || !source) {
    console.error(
      "Uso: pnpm ingest-curriculum <courseId> <arquivo.pdf> [--offer-id <offerId>] [--name <nome>]",
    )
    console.error(
      "Exemplo: pnpm ingest-curriculum eng-producao-diurno ./curriculum.pdf --offer-id eng-producao",
    )
    process.exit(1)
  }

  if (!source.toLowerCase().endsWith(".pdf")) {
    console.error("A fonte precisa ser um PDF de percurso curricular exportado do SIGA.")
    process.exit(1)
  }

  const resolved = path.resolve(source)
  console.log(`Parseando grade curricular de ${path.basename(resolved)}...`)
  const parsed = await parseCurriculumPdfFile(resolved)

  const courseName = nameOverride ?? parsed.courseName
  const resolvedOfferId = offerId ?? courseId.replace(/-(diurno|noturno)$/, "")

  const target = path.join(CURRICULUM_DIR, `${courseId}.json`)
  const payload = {
    classes: parsed.classes,
    prerequisites: parsed.prerequisites,
  }

  await mkdir(CURRICULUM_DIR, { recursive: true })
  await writeFile(target, JSON.stringify(payload, null, 2) + "\n")

  const index = await readCurriculumIndex()
  const existing = index.find((course) => course.id === courseId)
  const entry: CourseIndexEntry = {
    id: courseId,
    name: courseName,
    offerId: resolvedOfferId,
    shift: parsed.shift,
  }

  const nextIndex = existing
    ? index.map((course) => (course.id === courseId ? { ...course, ...entry } : course))
    : [...index, entry]

  await writeCurriculumIndex(nextIndex)
  await syncCurriculumLib()

  console.log(`Curso: ${courseName} (${parsed.shift})`)
  console.log(`Disciplinas obrigatórias: ${parsed.classes.length}`)
  console.log(`Pré-requisitos: ${parsed.prerequisites.length}`)
  console.log(`Gravado em data/curriculum/${courseId}.json`)
  console.log(`Índice atualizado em data/curriculum/index.json`)
  console.log(`lib/curriculum.ts atualizado`)
}

main()
