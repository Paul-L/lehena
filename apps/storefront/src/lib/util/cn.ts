type ClassValue =
  | string
  | number
  | null
  | undefined
  | false
  | ClassValue[]
  | Record<string, boolean | null | undefined>

export function cn(...inputs: ClassValue[]): string {
  const out: string[] = []
  const push = (v: ClassValue): void => {
    if (!v) return
    if (typeof v === "string" || typeof v === "number") {
      out.push(String(v))
      return
    }
    if (Array.isArray(v)) {
      for (const x of v) push(x)
      return
    }
    if (typeof v === "object") {
      for (const k of Object.keys(v)) {
        if (v[k]) out.push(k)
      }
    }
  }
  for (const i of inputs) push(i)
  return out.join(" ")
}
