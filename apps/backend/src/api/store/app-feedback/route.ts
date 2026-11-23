import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { escapeHtml, isTelegramConfigured, telegramCall } from "../../../lib/telegram"
import type { AppFeedbackBody } from "../../app-content-validators"

/** POST /store/app-feedback - "Rate this app" from the app, forwarded to the staff Telegram chat. */
export const POST = async (req: MedusaRequest<AppFeedbackBody>, res: MedusaResponse) => {
  const { rating, comment, name, phone } = req.validatedBody
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)
  const text = [
    `<b>رأي جديد بالتطبيق</b> ${"★".repeat(rating)}${"☆".repeat(5 - rating)}`,
    name || phone ? `${escapeHtml(name ?? "")} ${escapeHtml(phone ?? "")}`.trim() : null,
    comment ? escapeHtml(comment) : null,
  ]
    .filter(Boolean)
    .join("\n")
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID
  if (isTelegramConfigured() && chatId) {
    await telegramCall("sendMessage", { chat_id: chatId, text, parse_mode: "HTML" }).catch((e) =>
      logger.warn(`App feedback not sent to Telegram: ${(e as Error).message}`)
    )
  } else {
    logger.info(`App feedback (${rating}/5): ${comment ?? ""}`)
  }
  res.json({ ok: true })
}
