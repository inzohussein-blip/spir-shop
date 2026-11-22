import type { MetadataRoute } from "next"

/** PWA manifest: lets customers "Add to Home Screen" and use the store like an app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Spir Shop — كوزمتك ومنتجات عناية",
    short_name: "Spir Shop",
    description: "متجر مستحضرات التجميل ومنتجات العناية — توصيل لكل محافظات العراق والدفع عند الاستلام",
    start_url: "/",
    display: "standalone",
    dir: "rtl",
    lang: "ar",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }
}
