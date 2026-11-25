import Constants from "expo-constants"

/**
 * Which app this build is: the customers' shop, or the store manager's app
 * (APP_VARIANT=admin at build time, see app.config.js). On the web build
 * "?app=admin" opens the manager app, for testing.
 */
function readVariant(): "admin" | "customer" {
  if (typeof window !== "undefined" && typeof window.location?.search === "string") {
    if (new URLSearchParams(window.location.search).get("app") === "admin") return "admin"
  }
  const extra = Constants.expoConfig?.extra as { variant?: string } | undefined
  return extra?.variant === "admin" || process.env.EXPO_PUBLIC_APP_VARIANT === "admin" ? "admin" : "customer"
}

export const APP_VARIANT = readVariant()
export const IS_ADMIN_APP = APP_VARIANT === "admin"
