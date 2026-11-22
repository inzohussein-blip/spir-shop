/**
 * Minimal Telegram Bot API client (no dependencies).
 * Docs: https://core.telegram.org/bots/api
 */
const API = "https://api.telegram.org"

export function isTelegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN)
}

export async function telegramCall<T = unknown>(
  method: string,
  payload: Record<string, unknown>
): Promise<T> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is not set")
  }
  const res = await fetch(`${API}/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  })
  const json = (await res.json()) as { ok: boolean; result: T; description?: string }
  if (!json.ok) {
    throw new Error(`Telegram ${method} failed: ${json.description}`)
  }
  return json.result
}

export function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

export function formatIqd(amount: number): string {
  return `${Math.round(amount).toLocaleString("en-US")} د.ع`
}
