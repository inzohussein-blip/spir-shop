// Dynamic Expo config: the same code builds the app of any store.
// APP_STORE=<slug> picks stores/<slug>.json (default: spir).
// APP_VARIANT=admin builds the store manager's app (orders, products, ads)
// as a separate app next to the customer app: own name, package id and scheme.
const fs = require("fs")
const path = require("path")

module.exports = ({ config }) => {
  const slug = process.env.APP_STORE || "spir"
  const file = path.join(__dirname, "stores", `${slug}.json`)
  if (!fs.existsSync(file)) throw new Error(`Unknown store "${slug}": add stores/${slug}.json`)
  const store = JSON.parse(fs.readFileSync(file, "utf8"))
  const admin = process.env.APP_VARIANT === "admin"
  const icon = store.icon && fs.existsSync(path.join(__dirname, store.icon)) ? `./${store.icon}` : config.icon

  return {
    ...config,
    name: admin ? `${store.app_name} - الإدارة` : store.app_name,
    scheme: admin ? `${store.scheme}admin` : store.scheme,
    icon,
    splash: { ...config.splash, backgroundColor: store.splash_background || config.splash?.backgroundColor },
    ios: { ...config.ios, bundleIdentifier: admin ? `${store.ios_bundle}.admin` : store.ios_bundle },
    android: {
      ...config.android,
      package: admin ? `${store.android_package}.admin` : store.android_package,
      adaptiveIcon: store.icon
        ? { backgroundColor: store.splash_background || "#ffffff", foregroundImage: icon }
        : { ...config.android?.adaptiveIcon, backgroundColor: store.splash_background || config.android?.adaptiveIcon?.backgroundColor },
    },
    extra: { ...config.extra, store: store.slug, variant: admin ? "admin" : "customer" },
  }
}
