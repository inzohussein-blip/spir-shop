import type { Block } from "../lib/api"

export type BlockProps = { block: Block; props: Record<string, unknown> }

/** Safe readers: props come from the server and may be missing or of the wrong type. */
export const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback)
export const num = (v: unknown, fallback = 0) => {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN
  return Number.isFinite(n) ? n : fallback
}
export const bool = (v: unknown, fallback = false) => (typeof v === "boolean" ? v : fallback)
