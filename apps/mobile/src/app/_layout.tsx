import { Tajawal_400Regular, Tajawal_500Medium, Tajawal_700Bold, useFonts } from "@expo-google-fonts/tajawal"
import * as Notifications from "expo-notifications"
import { Stack, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useEffect, useState } from "react"
import { Platform, View } from "react-native"
import { SafeAreaProvider } from "react-native-safe-area-context"
import UpdatePrompts from "../components/UpdatePrompts"
import { CartProvider, useCart } from "../lib/cart"
import { StoreProvider } from "../lib/store"
import { COLORS } from "../lib/config"
import { DrawerProvider } from "../lib/drawer"
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
  const [fontsLoaded, fontError] = useFonts({ Tajawal_400Regular, Tajawal_500Medium, Tajawal_700Bold })
  // Render with system fonts if the font files fail to load, rather than blocking the app
  if (!fontsLoaded && !fontError) return null

  return (
    <SafeAreaProvider>
      <StoreProvider>
      <CartProvider>
        {/* dir="rtl" makes react-native-web lay out right-to-left; native uses forcesRTL in app.json */}
        <View style={{ flex: 1, backgroundColor: COLORS.bg }} {...({ dir: "rtl" } as object)}>
          <StatusBar style="dark" />
          <PushBridge />
          <DrawerProvider>
            {/* Every screen draws its own header (components/Header) to match the design */}
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.bg } }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="stories" options={{ presentation: "fullScreenModal", animation: "fade" }} />
              <Stack.Screen name="order/[id]" options={{ gestureEnabled: false }} />
            </Stack>
          </DrawerProvider>
          <UpdatePrompts />
        </View>
      </CartProvider>
      </StoreProvider>
    </SafeAreaProvider>
  )
}
