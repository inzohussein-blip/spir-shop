import type { AppSettings } from "./api"
import type { IconName } from "../components/Icon"

/** WhatsApp / Telegram / phone links from the app settings (only those that are filled in). */
export function contactLinks(settings: AppSettings, message?: string) {
  const text = message ? `?text=${encodeURIComponent(message)}` : ""
  return [
    settings.whatsapp_number ? { icon: "message-circle" as IconName, label: "واتساب", url: `https://wa.me/${settings.whatsapp_number.replace(/\D/g, "")}${text}` } : null,
    settings.telegram_username ? { icon: "send" as IconName, label: "تلكرام", url: `https://t.me/${settings.telegram_username.replace(/^@/, "")}` } : null,
    settings.support_phone ? { icon: "phone" as IconName, label: "اتصال", url: `tel:${settings.support_phone}` } : null,
  ].filter((x): x is { icon: IconName; label: string; url: string } => !!x)
}
