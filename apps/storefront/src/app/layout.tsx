import { getBaseURL } from "@lib/util/env"
import TelegramMiniApp from "@lib/telegram/telegram-mini-app"
import { Metadata, Viewport } from "next"
import Script from "next/script"
import "styles/globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  applicationName: "Spir Shop",
  appleWebApp: { capable: true, title: "Spir Shop", statusBarStyle: "default" },
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" data-mode="light">
      <head>
        <link rel="ucp" href="/.well-known/ucp" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="afterInteractive"
        />
        <TelegramMiniApp />
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
