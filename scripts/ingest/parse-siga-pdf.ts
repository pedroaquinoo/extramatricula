import { readFile } from "fs/promises"
import {
  extractContentStreams,
  extractFragments,
  extractRowSeparators,
  textOfColumn,
  type Fragment,
} from "./pdf-utils"

/**
 * Parser da "Mapa de oferta por curso" exportada do SIGA (UFMG).
 *
 * O PDF é uma tabela com bordas geradas pelo relatório do SIGA. Cada página
 * repete o cabeçalho e lista as turmas ofertadas para um percurso curricular.
 * A extração é 100% determinística (sem LLM):
 *
 *  - As linhas horizontais que atravessam a tabela de ponta a ponta definem os
 *    limites verticais de cada linha (row) da tabela.
 *  - As faixas de coordenada X definem as colunas.
 *
 * Não há dependências externas: o Node já traz o `zlib` para descomprimir os
 * streams FlateDecode e o texto do PDF usa codificação WinAnsi/latin1 direta.
 */

export interface ClassTime {
  day: string
  start: string
  end: string
}

export interface AvailableClass {
  course_id: string
  name: string
  availabilityCode: string
  spots: number
  times: ClassTime[]
  teachers: string[]
}

/** Faixas de coluna: [xInicial, xFinal, nome]. */
const COLUMNS: Array<[number, number, string]> = [
  [48, 96, "codigo"],
  [96, 220, "titulo"],
  [220, 240, "ch"],
  [240, 379, "demandantes"],
  [379, 419, "oft"],
  [419, 454, "id"],
  [454, 488, "tipo"],
  [488, 522, "vagas"],
  [522, 633, "horario"],
  [633, 900, "prof"],
]

const DAYS: Record<string, string> = {
  Seg: "Segunda",
  Ter: "Terca",
  Qua: "Quarta",
  Qui: "Quinta",
  Sex: "Sexta",
  Sab: "Sabado",
  Dom: "Domingo",
}

function columnOf(x: number): string | null {
  for (const [start, end, name] of COLUMNS) {
    if (x >= start - 2 && x < end) return name
  }
  return null
}

function parseTimes(cells: Map<string, Fragment[]>): ClassTime[] {
  const times: ClassTime[] = []
  for (const raw of textOfColumn(cells, "horario")) {
    const m = raw.trim().match(/(\d{2}:\d{2})\s+(\d{2}:\d{2})\s*\((\w{3})\)/)
    if (m) times.push({ day: DAYS[m[3]] ?? m[3], start: m[1], end: m[2] })
  }
  return times
}

function parseTeachers(cells: Map<string, Fragment[]>): string[] {
  // Cada professor: uma ou mais linhas de nome (podem quebrar), terminando com
  // vírgula, seguidas de uma linha "inscrição, encargo" (começa com dígito).
  const teachers: string[] = []
  let current: string[] = []
  const flush = () => {
    if (current.length) {
      const name = current.join(" ").replace(/,\s*$/, "").trim()
      if (name && name !== "-") teachers.push(name)
      current = []
    }
  }
  for (const raw of textOfColumn(cells, "prof")) {
    const p = raw.trim()
    if (!p || /^e outros/i.test(p)) continue
    if (/^\d/.test(p)) {
      flush()
    } else {
      current.push(p.replace(/,\s*$/, ""))
    }
  }
  flush()
  return teachers
}

function buildRows(frags: Fragment[], separators: number[]): AvailableClass[] {
  const rows: AvailableClass[] = []
  for (let i = 0; i < separators.length - 1; i++) {
    const top = separators[i]
    const bottom = separators[i + 1]
    const cells = new Map<string, Fragment[]>()
    for (const f of frags) {
      if (f.y >= bottom - 1 && f.y < top - 1) {
        const col = columnOf(f.x)
        if (col) {
          const list = cells.get(col)
          if (list) list.push(f)
          else cells.set(col, [f])
        }
      }
    }
    if (!cells.has("codigo")) continue
    const courseId = textOfColumn(cells, "codigo").join(" ").trim()
    if (!/^[A-Z]{2,4}\d/.test(courseId)) continue // pula cabeçalhos/rodapés

    const name = textOfColumn(cells, "titulo").join(" ").trim()
    const availabilityCode = textOfColumn(cells, "id").join("").trim()
    const vagas = textOfColumn(cells, "vagas").join("").trim()

    rows.push({
      course_id: courseId,
      name,
      availabilityCode,
      spots: /^\d+$/.test(vagas) ? parseInt(vagas, 10) : 0,
      times: parseTimes(cells),
      teachers: parseTeachers(cells),
    })
  }
  return rows
}

/** Faz o parse de um único PDF do SIGA e devolve as turmas encontradas. */
export function parseSigaPdfBuffer(buffer: Buffer): AvailableClass[] {
  const rows: AvailableClass[] = []
  for (const content of extractContentStreams(buffer)) {
    const frags = extractFragments(content)
    const separators = extractRowSeparators(content)
    rows.push(...buildRows(frags, separators))
  }
  return rows
}

export async function parseSigaPdfFile(filePath: string): Promise<AvailableClass[]> {
  const buffer = await readFile(filePath)
  return parseSigaPdfBuffer(buffer)
}

/** Deduplica turmas por (course_id, availabilityCode), preservando a ordem. */
export function dedupeClasses(classes: AvailableClass[]): AvailableClass[] {
  const seen = new Map<string, AvailableClass>()
  for (const cls of classes) {
    const key = `${cls.course_id}:${cls.availabilityCode}`
    if (!seen.has(key)) seen.set(key, cls)
  }
  return [...seen.values()]
}
