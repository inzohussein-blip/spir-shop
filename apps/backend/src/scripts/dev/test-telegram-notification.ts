import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import orderPlacedTelegram from "../../subscribers/order-placed-telegram"

/**
 * Dev check: renders the Telegram new-order message for the latest order
 * WITHOUT calling Telegram (fetch is mocked and the payload printed).
 * Run: npx medusa exec ./src/scripts/dev/test-telegram-notification.ts
 */
export default async function testTelegramNotification({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "order",
    fields: ["id", "created_at"],
  })
  const latest = data.sort((a, b) => +new Date(b.created_at as Date) - +new Date(a.created_at as Date))[0]
  if (!latest) {
    console.log("No orders yet")
    return
  }

  process.env.TELEGRAM_BOT_TOKEN ||= "TEST"
  process.env.TELEGRAM_ADMIN_CHAT_ID ||= "123"
  const realFetch = globalThis.fetch
  globalThis.fetch = (async (url: string, init: { body: string }) => {
    console.log("→", String(url).replace(/bot[^/]+/, "bot***"))
    console.log(JSON.parse(init.body).text)
    return new Response(JSON.stringify({ ok: true, result: {} }))
  }) as unknown as typeof fetch

  try {
    await orderPlacedTelegram({
      event: { name: "order.placed", data: { id: latest.id } },
      container,
    } as never)
  } finally {
    globalThis.fetch = realFetch
  }
}
