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

/** "منذ 5 دقائق" style relative time for reviews and notifications. */
export function timeAgo(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return "الآن"
  const m = Math.floor(s / 60)
  if (m < 60) return `منذ ${m} د`
  const h = Math.floor(m / 60)
  if (h < 24) return `منذ ${h} س`
  const d = Math.floor(h / 24)
  if (d < 30) return `منذ ${d} يوم`
  return new Date(iso).toLocaleDateString("en-GB")
}
