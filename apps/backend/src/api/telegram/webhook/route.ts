import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { telegramCall } from "../../../lib/telegram"

/**
 * Telegram bot webhook: POST /telegram/webhook
 * Register with:  npx medusa exec ./src/scripts/telegram-setup.ts
 *
 * Replies to /start (and any message) with a button that opens the store
 * as a Telegram Mini App.
 */
type Update = {
  message?: { chat: { id: number }; text?: string; from?: { first_name?: string } }
}

export const POST = async (req: MedusaRequest<Update>, res: MedusaResponse) => {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET
  if (!secret || req.headers["x-telegram-bot-api-secret-token"] !== secret) {
    return res.status(401).json({ ok: false })
  }

  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)
  const message = req.body?.message
  const storeUrl = process.env.STOREFRONT_URL

  if (message && storeUrl) {
    const name = message.from?.first_name ?? ""
    try {
      await telegramCall("sendMessage", {
        chat_id: message.chat.id,
        text: `أهلاً ${name} 💄\nتصفّح منتجات العناية والمكياج واطلب مباشرة من داخل تلكرام، والدفع عند الاستلام.`,
        reply_markup: {
          inline_keyboard: [[{ text: "🛍️ افتح المتجر", web_app: { url: storeUrl } }]],
        },
      })
    } catch (e) {
      logger.error(`Telegram reply failed: ${(e as Error).message}`)
    }
  }

  // Always 200 so Telegram doesn't retry.
  res.status(200).json({ ok: true })
}
