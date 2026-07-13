import { inflateSync } from "zlib"

export interface Fragment {
  x: number
  y: number
  text: string
}

type Matrix = [number, number, number, number, number, number]

const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0]

function multiply(a: Matrix, b: Matrix): Matrix {
  return [
    a[0] * b[0] + a[1] * b[2],
    a[0] * b[1] + a[1] * b[3],
    a[2] * b[0] + a[3] * b[2],
    a[2] * b[1] + a[3] * b[3],
    a[4] * b[0] + a[5] * b[2] + b[4],
    a[4] * b[1] + a[5] * b[3] + b[5],
  ]
}

export function unescapePdfString(literal: string): string {
  let s = literal.slice(1, -1)
  s = s.replace(/\\([0-7]{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
  s = s.replace(/\\(.)/g, (_, ch) => {
    if (ch === "n") return "\n"
    if (ch === "r") return ""
    if (ch === "t") return " "
    return ch
  })
  return s
}

export function extractContentStreams(buffer: Buffer): string[] {
  const latin1 = buffer.toString("latin1")
  const re = /stream\r?\n/g
  const streams: string[] = []
  let match: RegExpExecArray | null
  while ((match = re.exec(latin1)) !== null) {
    const dataStart = match.index + match[0].length
    const end = latin1.indexOf("endstream", dataStart)
    if (end === -1) continue
    let dataEnd = end
    if (latin1[dataEnd - 1] === "\n") dataEnd--
    if (latin1[dataEnd - 1] === "\r") dataEnd--
    const bytes = Buffer.from(latin1.slice(dataStart, dataEnd), "latin1")
    try {
      const inflated = inflateSync(bytes).toString("latin1")
      if (inflated.includes("Tj")) streams.push(inflated)
    } catch {
      // Stream não é FlateDecode de texto.
    }
  }
  return streams
}

export function extractFragments(content: string): Fragment[] {
  const tokenRe =
    /\((?:[^()\\]|\\.)*\)|BT|ET|-?[\d.]+|T[dscz*fL]|Tm|Tj|TJ|[a-zA-Z*'"]+/g
  const frags: Fragment[] = []
  let tlm: Matrix = [...IDENTITY]
  let tm: Matrix = [...IDENTITY]
  let leading = 0
  let nums: number[] = []
  let match: RegExpExecArray | null
  while ((match = tokenRe.exec(content)) !== null) {
    const t = match[0]
    if (/^-?[\d.]+$/.test(t)) {
      nums.push(parseFloat(t))
      continue
    }
    if (t === "Tm") {
      tm = nums.slice(-6) as Matrix
      tlm = [...tm]
      nums = []
    } else if (t === "Td") {
      tlm = multiply([1, 0, 0, 1, nums[nums.length - 2], nums[nums.length - 1]], tlm)
      tm = [...tlm]
      nums = []
    } else if (t === "TD") {
      leading = -nums[nums.length - 1]
      tlm = multiply([1, 0, 0, 1, nums[nums.length - 2], nums[nums.length - 1]], tlm)
      tm = [...tlm]
      nums = []
    } else if (t === "TL") {
      leading = nums[nums.length - 1]
      nums = []
    } else if (t === "T*") {
      tlm = multiply([1, 0, 0, 1, 0, -leading], tlm)
      tm = [...tlm]
    } else if (t === "BT") {
      tlm = [...IDENTITY]
      tm = [...IDENTITY]
      nums = []
    } else if (t.startsWith("(")) {
      frags.push({ x: tm[4], y: tm[5], text: unescapePdfString(t) })
      nums = []
    } else {
      nums = []
    }
  }
  return frags
}

export function extractRowSeparators(content: string): number[] {
  const lineRe = /(-?[\d.]+)\s+(-?[\d.]+)\s+m\s+(-?[\d.]+)\s+(-?[\d.]+)\s+l/g
  const spansByY = new Map<number, { lo: number; hi: number }>()
  let match: RegExpExecArray | null
  while ((match = lineRe.exec(content)) !== null) {
    const x0 = parseFloat(match[1])
    const y0 = parseFloat(match[2])
    const x1 = parseFloat(match[3])
    const y1 = parseFloat(match[4])
    if (Math.abs(y0 - y1) >= 1) continue
    const y = Math.round(y0)
    const lo = Math.min(x0, x1)
    const hi = Math.max(x0, x1)
    const cur = spansByY.get(y)
    if (cur) {
      cur.lo = Math.min(cur.lo, lo)
      cur.hi = Math.max(cur.hi, hi)
    } else {
      spansByY.set(y, { lo, hi })
    }
  }
  const seps: number[] = []
  for (const [y, { lo, hi }] of spansByY) {
    if (lo < 60 && hi > 700) seps.push(y)
  }
  return seps.sort((a, b) => b - a)
}

export function textOfColumn(cells: Map<string, Fragment[]>, name: string): string[] {
  const list = cells.get(name)
  if (!list) return []
  return [...list]
    .sort((a, b) => (b.y !== a.y ? b.y - a.y : a.x - b.x))
    .map((f) => f.text)
}
