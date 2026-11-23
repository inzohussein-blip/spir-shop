import AsyncStorage from "@react-native-async-storage/async-storage"
import Constants from "expo-constants"
import * as Device from "expo-device"
import * as Notifications from "expo-notifications"
import { Platform } from "react-native"
import { registerPushToken } from "./api"

const PROVINCE_KEY = "spir_province"

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  })
}

export const rememberProvince = (province: string) => AsyncStorage.setItem(PROVINCE_KEY, province)

let cachedToken: string | null = null

/**
 * Asks for notification permission (once), gets the Expo push token and sends it
 * to the backend together with the cart id and province for targeting.
 * Safe to call often; does nothing on web, simulators, or without an EAS projectId.
 */
export async function syncPushToken(cartId?: string | null, orderId?: string | null) {
  try {
    if (Platform.OS === "web" || !Device.isDevice) return
    const projectId =
      (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ??
      Constants.easConfig?.projectId
    if (!projectId) return

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "العروض والطلبات",
        importance: Notifications.AndroidImportance.DEFAULT,
      })
    }

    let { status } = await Notifications.getPermissionsAsync()
    if (status !== "granted") {
      status = (await Notifications.requestPermissionsAsync()).status
    }
    if (status !== "granted") return

    cachedToken = cachedToken ?? (await Notifications.getExpoPushTokenAsync({ projectId })).data
    const province = await AsyncStorage.getItem(PROVINCE_KEY)
    await registerPushToken({
      token: cachedToken,
      platform: Platform.OS,
      cart_id: cartId ?? null,
      province,
      order_id: orderId ?? null,
    })
  } catch {
    // Notifications are optional: never break the app because of them
  }
}
