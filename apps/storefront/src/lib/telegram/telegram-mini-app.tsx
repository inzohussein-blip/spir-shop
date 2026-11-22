"use client"

import { useEffect } from "react"

type TelegramWebApp = {
  initData: string
  ready: () => void
  expand: () => void
  setHeaderColor?: (color: string) => void
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp }
  }
}

/**
 * When the storefront is opened inside Telegram (bot menu button / Mini App),
 * tell Telegram the page is ready and expand it to full height.
 * Outside Telegram this does nothing.
 */
export default function TelegramMiniApp() {
  useEffect(() => {
    const webApp = window.Telegram?.WebApp
    if (!webApp || !webApp.initData) {
      return
    }
    webApp.ready()
    webApp.expand()
    webApp.setHeaderColor?.("#ffffff")
    document.documentElement.dataset.telegram = "true"
  }, [])

  return null
}
