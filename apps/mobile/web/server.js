// Serves the exported web app (dist/) on Railway or any Node host.
// Hashed build files are cached for a year; index.html, the manifest and the
// service worker are always revalidated, so a new deploy is picked up at once.
// Unknown paths fall back to index.html (client-side routes such as /product/x).
const http = require("http")
const fs = require("fs")
const path = require("path")
const zlib = require("zlib")

const ROOT = path.resolve(process.argv[2] || path.join(__dirname, "..", "dist"))
const PORT = Number(process.env.PORT || 8080)
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
}
const COMPRESSIBLE = new Set([".html", ".js", ".css", ".json", ".webmanifest", ".svg", ".ttf"])
const SECURITY = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
}

function resolveFile(urlPath) {
  const clean = path.normalize(decodeURIComponent(urlPath.split("?")[0])).replace(/^(\.\.[/\\])+/, "")
  const file = path.join(ROOT, clean)
  if (file.startsWith(ROOT) && fs.existsSync(file) && fs.statSync(file).isFile()) return file
  return path.join(ROOT, "index.html")
}

http
  .createServer((req, res) => {
    if (req.url === "/healthz") return res.writeHead(200).end("ok")
    const file = resolveFile(req.url || "/")
    const ext = path.extname(file)
    const hashed = (req.url || "").startsWith("/_expo/static/") || (req.url || "").startsWith("/assets/")
    const headers = {
      ...SECURITY,
      "Content-Type": TYPES[ext] || "application/octet-stream",
      "Cache-Control": hashed ? "public, max-age=31536000, immutable" : "no-cache",
    }
    const gzip = COMPRESSIBLE.has(ext) && /\bgzip\b/.test(req.headers["accept-encoding"] || "")
    if (gzip) headers["Content-Encoding"] = "gzip"
    res.writeHead(200, headers)
    if (req.method === "HEAD") return res.end()
    const stream = fs.createReadStream(file)
    ;(gzip ? stream.pipe(zlib.createGzip()) : stream).pipe(res)
  })
  .listen(PORT, () => console.log(`Web app on :${PORT}`))
