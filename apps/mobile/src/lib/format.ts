export const formatIqd = (amount?: number | null) =>
  `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(amount ?? 0))} د.ع`

/** Compare dotted versions: returns -1, 0 or 1 ("1.10.0" > "1.9.3"). */
export function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map((n) => parseInt(n, 10) || 0)
  const pb = b.split(".").map((n) => parseInt(n, 10) || 0)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (d !== 0) return d > 0 ? 1 : -1
  }
  return 0
}
