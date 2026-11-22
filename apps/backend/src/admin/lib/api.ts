/**
 * Small fetch helper for admin extensions. The dashboard is served by the same
 * backend, so the session cookie authenticates these calls.
 */
export async function adminFetch<T>(
  path: string,
  init: { method?: string; body?: unknown } = {}
): Promise<T> {
  const res = await fetch(path, {
    method: init.method ?? "GET",
    credentials: "include",
    headers: init.body ? { "content-type": "application/json" } : undefined,
    body: init.body ? JSON.stringify(init.body) : undefined,
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((json as { message?: string }).message || `HTTP ${res.status}`)
  }
  return json as T
}

/** Uploads a file with the built-in /admin/uploads endpoint and returns its URL. */
export async function uploadFile(file: File): Promise<string> {
  const form = new FormData()
  form.append("files", file)
  const res = await fetch("/admin/uploads", { method: "POST", credentials: "include", body: form })
  if (!res.ok) throw new Error(`Upload failed (HTTP ${res.status})`)
  const json = (await res.json()) as { files: { url: string }[] }
  return json.files[0].url
}

export type Block = { id: string; type: string; props: Record<string, unknown> }
export type Option = { label: string; value: string }

export const IRAQ_GOVERNORATES = [
  "بغداد", "البصرة", "نينوى", "أربيل", "السليمانية", "دهوك", "كركوك", "النجف", "كربلاء",
  "بابل", "الأنبار", "ديالى", "صلاح الدين", "واسط", "ذي قار", "ميسان", "المثنى", "القادسية", "حلبجة",
]
