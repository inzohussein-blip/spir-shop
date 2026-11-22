import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { View } from "react-native"
import { SafeAreaProvider } from "react-native-safe-area-context"
import UpdatePrompts from "../components/UpdatePrompts"
import { CartProvider } from "../lib/cart"
import { COLORS } from "../lib/config"

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <CartProvider>
        {/* dir="rtl" makes react-native-web lay out right-to-left; native uses forcesRTL in app.json */}
        <View style={{ flex: 1, backgroundColor: COLORS.bg }} {...({ dir: "rtl" } as object)}>
          <StatusBar style="dark" />
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
            <Stack.Screen name="checkout" options={{ title: "إتمام الطلب" }} />
            <Stack.Screen name="order/[id]" options={{ title: "تم الطلب", headerBackVisible: false }} />
          </Stack>
          <UpdatePrompts />
        </View>
      </CartProvider>
    </SafeAreaProvider>
  )
}
