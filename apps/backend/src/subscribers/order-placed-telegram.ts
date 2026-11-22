import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  escapeHtml,
  formatIqd,
  isTelegramConfigured,
  telegramCall,
} from "../lib/telegram"

/**
 * Sends a Telegram message to the store owner / staff group for every new order.
 * Requires TELEGRAM_BOT_TOKEN and TELEGRAM_ADMIN_CHAT_ID.
 */
export default async function orderPlacedTelegram({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID
  if (!isTelegramConfigured() || !chatId) {
    return
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [order],
  } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "email",
      "currency_code",
      "total",
      "shipping_total",
      "items.title",
      "items.variant_title",
      "items.quantity",
      "items.unit_price",
      "shipping_address.first_name",
      "shipping_address.last_name",
      "shipping_address.phone",
      "shipping_address.city",
      "shipping_address.province",
      "shipping_address.address_1",
      "shipping_methods.name",
    ],
    filters: { id: data.id },
  })

  if (!order) {
    return
  }

  const a = order.shipping_address
  const items = (order.items ?? [])
    .map((i) => {
      const variant = i?.variant_title && i.variant_title !== "قياسي" ? ` (${i.variant_title})` : ""
      return `• ${escapeHtml(`${i?.title}${variant}`)} × ${i?.quantity} — ${formatIqd(Number(i?.unit_price) * Number(i?.quantity))}`
    })
    .join("\n")

  const text = [
    `🛍️ <b>طلب جديد #${order.display_id}</b>`,
    "",
    `👤 ${escapeHtml(`${a?.first_name ?? ""} ${a?.last_name ?? ""}`.trim())}`,
    a?.phone ? `📞 <code>${escapeHtml(a.phone)}</code>` : null,
    `📍 ${escapeHtml([a?.province, a?.city, a?.address_1].filter(Boolean).join(" - "))}`,
    "",
    items,
    "",
    `🚚 ${escapeHtml(order.shipping_methods?.[0]?.name ?? "")}: ${formatIqd(Number(order.shipping_total))}`,
    `💰 <b>المجموع: ${formatIqd(Number(order.total))}</b> (دفع عند الاستلام)`,
  ]
    .filter((l) => l !== null)
    .join("\n")

  try {
    await telegramCall("sendMessage", { chat_id: chatId, text, parse_mode: "HTML" })
  } catch (e) {
    logger.error(`Telegram order notification failed: ${(e as Error).message}`)
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
