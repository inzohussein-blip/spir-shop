import * as Notifications from "expo-notifications"
import { Stack, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useEffect } from "react"
import { Platform, View } from "react-native"
import { SafeAreaProvider } from "react-native-safe-area-context"
import UpdatePrompts from "../components/UpdatePrompts"
import { CartProvider, useCart } from "../lib/cart"
import { COLORS } from "../lib/config"
import { openLink } from "../lib/links"
import { syncPushToken } from "../lib/push"

/** Registers the push token (with the current cart) and opens links from tapped notifications. */
function PushBridge() {
  const router = useRouter()
  const { cart } = useCart()

  useEffect(() => {
    const t = setTimeout(() => syncPushToken(cart?.id), 2000)
    return () => clearTimeout(t)
  }, [cart?.id])

  useEffect(() => {
    if (Platform.OS === "web") return
    const open = (r: Notifications.NotificationResponse | null | undefined) => {
      const url = r?.notification.request.content.data?.url
      if (typeof url === "string") openLink(router, url)
    }
    // App opened from a notification while it was closed
    Notifications.getLastNotificationResponseAsync().then(open)
    // Notification tapped while the app is running
    const sub = Notifications.addNotificationResponseReceivedListener(open)
    return () => sub.remove()
  }, [router])

  return null
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <CartProvider>
        {/* dir="rtl" makes react-native-web lay out right-to-left; native uses forcesRTL in app.json */}
        <View style={{ flex: 1, backgroundColor: COLORS.bg }} {...({ dir: "rtl" } as object)}>
          <StatusBar style="dark" />
          <PushBridge />
          <Stack
            screenOptions={{
              headerTitleAlign: "center",
              headerTintColor: COLORS.primaryDark,
              headerBackTitle: "رجوع",
              contentStyle: { backgroundColor: COLORS.bg },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="product/[handle]" options={{ title: "" }} />
            <Stack.Screen name="category/[id]" options={{ title: "" }} />
            <Stack.Screen
              name="stories"
              options={{ headerShown: false, presentation: "fullScreenModal", animation: "fade" }}
            />
            <Stack.Screen name="checkout" options={{ title: "إتمام الطلب" }} />
            <Stack.Screen name="order/[id]" options={{ title: "تم الطلب", headerBackVisible: false }} />
          </Stack>
          <UpdatePrompts />
        </View>
      </CartProvider>
    </SafeAreaProvider>
  )
}
