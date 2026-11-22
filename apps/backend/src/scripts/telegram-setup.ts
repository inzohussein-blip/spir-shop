import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { telegramCall } from "../lib/telegram"

/**
 * One-time Telegram bot setup:
 *  - registers the webhook (BACKEND_PUBLIC_URL/telegram/webhook)
 *  - sets the chat menu button to open the storefront as a Mini App
 *
 * Run: cd apps/backend && npx medusa exec ./src/scripts/telegram-setup.ts
 * Needs: TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, BACKEND_PUBLIC_URL, STOREFRONT_URL (all https)
 */
export default async function telegramSetup({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const backend = process.env.BACKEND_PUBLIC_URL?.replace(/\/$/, "")
  const store = process.env.STOREFRONT_URL

  if (!backend || !store || !process.env.TELEGRAM_WEBHOOK_SECRET) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Set BACKEND_PUBLIC_URL, STOREFRONT_URL and TELEGRAM_WEBHOOK_SECRET first"
    )
  }

  await telegramCall("setWebhook", {
    url: `${backend}/telegram/webhook`,
    secret_token: process.env.TELEGRAM_WEBHOOK_SECRET,
    allowed_updates: ["message"],
  })
  await telegramCall("setChatMenuButton", {
    menu_button: { type: "web_app", text: "المتجر", web_app: { url: store } },
  })
  await telegramCall("setMyCommands", {
    commands: [{ command: "start", description: "افتح المتجر" }],
  })

  logger.info("Telegram bot configured ✅")
}
