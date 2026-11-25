// Offline support for the web app.
// - App files under /_expo/static have a content hash in their name, so they are cached forever.
// - Pages: network first, falling back to the cached app shell when offline.
// - API calls are never cached here (the app keeps its own copy of the last home layout).
const VERSION = "v1"
const SHELL = `shell-${VERSION}`
const STATIC = "static-v1"

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL).then((c) => c.addAll(["/", "/manifest.webmanifest"])))
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== SHELL && k !== STATIC).map((k) => caches.delete(k))))
  )
  self.clients.claim()
})

self.addEventListener("fetch", (event) => {
  const req = event.request
  const url = new URL(req.url)
  if (req.method !== "GET" || url.origin !== self.location.origin) return

  if (url.pathname.startsWith("/_expo/static/") || url.pathname.startsWith("/assets/")) {
    event.respondWith(
      caches.open(STATIC).then(async (c) => {
        const hit = await c.match(req)
        if (hit) return hit
        const res = await fetch(req)
        if (res.ok) c.put(req, res.clone())
        return res
      })
    )
    return
  }

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(SHELL).then((c) => c.put("/", copy))
          return res
        })
        .catch(() => caches.match("/"))
    )
  }
})
