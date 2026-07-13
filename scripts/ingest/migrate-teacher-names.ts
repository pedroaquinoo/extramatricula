import { readdir, readFile, writeFile } from "fs/promises"
import path from "path"
import { anonymizeTeachers } from "./teacher-names"
import type { AvailableClass } from "./parse-offer-pdf"

const ROOT = process.cwd()
const OFFERS_DIR = path.join(ROOT, "data", "offers")

async function listOfferFiles(): Promise<string[]> {
  const files: string[] = []
  const terms = await readdir(OFFERS_DIR, { withFileTypes: true })
  for (const term of terms) {
    if (!term.isDirectory()) continue
    const termDir = path.join(OFFERS_DIR, term.name)
    const offers = await readdir(termDir)
    for (const offer of offers) {
      if (offer.endsWith(".json")) {
        files.push(path.join(termDir, offer))
      }
    }
  }
  return files
}

async function migrateFile(filePath: string) {
  const raw = await readFile(filePath, "utf8")
  const classes = JSON.parse(raw) as AvailableClass[]

  let idsRemoved = 0
  let namesChanged = 0

  const migrated = classes.map((cls) => {
    const before = cls.teachers
    const after = anonymizeTeachers(before)
    for (const name of before) {
      if (/^\d+[A-Z]?$/i.test(name.trim())) idsRemoved++
    }
    if (before.join("\0") !== after.join("\0")) namesChanged++
    return { ...cls, teachers: after }
  })

  await writeFile(filePath, JSON.stringify(migrated, null, 2) + "\n")

  const relative = path.relative(ROOT, filePath)
  console.log(
    `${relative}: ${classes.length} turmas, ${namesChanged} alteradas, ${idsRemoved} matrículas removidas`,
  )
}

async function main() {
  const files = await listOfferFiles()
  if (files.length === 0) {
    console.log("Nenhum arquivo de oferta encontrado.")
    return
  }
  for (const file of files) {
    await migrateFile(file)
  }
}

main()
