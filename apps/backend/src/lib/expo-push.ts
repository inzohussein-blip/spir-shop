/**
 * Minimal Expo Push API client.
 * Docs: https://docs.expo.dev/push-notifications/sending-notifications/
 *
 * EXPO_ACCESS_TOKEN is optional (needed only if "enhanced push security" is on).
 * EXPO_PUSH_URL can point to a mock server in development/tests.
 */
export type PushMessage = {
  to: string
  title: string
  body: string
  data?: Record<string, unknown>
  sound?: "default"
}

export type PushResult = {
  sent: number
  failed: number
  /** Tokens Expo reports as no longer registered: disable them. */
  invalidTokens: string[]
}

const CHUNK = 100

export const isExpoPushToken = (token: string) =>
  /^Expo(nent)?PushToken\[.+\]$/.test(token)

export async function sendExpoPush(messages: PushMessage[]): Promise<PushResult> {
  const url = process.env.EXPO_PUSH_URL || "https://exp.host/--/api/v2/push/send"
  const result: PushResult = { sent: 0, failed: 0, invalidTokens: [] }

  for (let i = 0; i < messages.length; i += CHUNK) {
    const chunk = messages.slice(i, i + CHUNK)
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
          ...(process.env.EXPO_ACCESS_TOKEN
            ? { authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` }
            : {}),
        },
        body: JSON.stringify(chunk.map((m) => ({ sound: "default", ...m }))),
      })
      const json = (await res.json()) as {
        data?: { status: "ok" | "error"; details?: { error?: string } }[]
      }
      const tickets = json.data ?? []
      chunk.forEach((m, idx) => {
        const t = tickets[idx]
        if (t?.status === "ok") {
          result.sent++
        } else {
          result.failed++
          if (t?.details?.error === "DeviceNotRegistered") {
            result.invalidTokens.push(m.to)
          }
        }
      })
    } catch {
      result.failed += chunk.length
    }
  }
  return result
}
