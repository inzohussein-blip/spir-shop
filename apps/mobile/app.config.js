// Dynamic Expo config: the same code builds the app of any store.
// APP_STORE=<slug> picks stores/<slug>.json (default: spir).
const fs = require("fs")
const path = require("path")

module.exports = ({ config }) => {
  const slug = process.env.APP_STORE || "spir"
  const file = path.join(__dirname, "stores", `${slug}.json`)
  if (!fs.existsSync(file)) throw new Error(`Unknown store "${slug}": add stores/${slug}.json`)
  const store = JSON.parse(fs.readFileSync(file, "utf8"))
  const icon = store.icon && fs.existsSync(path.join(__dirname, store.icon)) ? `./${store.icon}` : config.icon

  return {
    ...config,
    name: store.app_name,
    scheme: store.scheme,
    icon,
    splash: { ...config.splash, backgroundColor: store.splash_background || config.splash?.backgroundColor },
    ios: { ...config.ios, bundleIdentifier: store.ios_bundle },
    android: {
      ...config.android,
      package: store.android_package,
      adaptiveIcon: store.icon
        ? { backgroundColor: store.splash_background || "#ffffff", foregroundImage: icon }
        : { ...config.android?.adaptiveIcon, backgroundColor: store.splash_background || config.android?.adaptiveIcon?.backgroundColor },
    },
    extra: { ...config.extra, store: store.slug },
  }
}
