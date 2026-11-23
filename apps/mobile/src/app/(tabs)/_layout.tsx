import { Tabs } from "expo-router"
import Icon, { IconName } from "../../components/Icon"
import { useCart } from "../../lib/cart"
import { COLORS, FONTS } from "../../lib/config"
import { useStore } from "../../lib/store"

const tabIcon =
  (name: IconName) =>
  ({ focused }: { focused: boolean }) => <Icon name={name} size={22} color={focused ? COLORS.text : "#b5b5b9"} />

/** Bottom bar: Home, Categories, Wishlist, Cart, Account (icons with labels). */
export default function TabsLayout() {
  const { count } = useCart()
  const { wishlist } = useStore()
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.text,
        tabBarInactiveTintColor: "#b5b5b9",
        tabBarLabelStyle: { fontFamily: FONTS.medium, fontSize: 11 },
        tabBarStyle: { height: 70, borderTopColor: COLORS.border, paddingTop: 6, paddingBottom: 8 },
        headerTitleAlign: "center",
        headerTintColor: COLORS.text,
        headerTitleStyle: { fontFamily: FONTS.bold, fontSize: 18 },
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: COLORS.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "الرئيسية", headerShown: false, tabBarIcon: tabIcon("home") }} />
      <Tabs.Screen name="search" options={{ title: "الأقسام", tabBarIcon: tabIcon("grid") }} />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: "المفضلة",
          tabBarIcon: tabIcon("heart"),
          tabBarBadge: wishlist.length > 0 ? wishlist.length : undefined,
          tabBarBadgeStyle: { backgroundColor: COLORS.danger, fontFamily: FONTS.bold, fontSize: 10 },
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "السلة",
          tabBarIcon: tabIcon("shopping-bag"),
          tabBarBadge: count > 0 ? count : undefined,
          tabBarBadgeStyle: { backgroundColor: COLORS.accent, fontFamily: FONTS.bold, fontSize: 10 },
        }}
      />
      <Tabs.Screen name="account" options={{ title: "حسابي", tabBarIcon: tabIcon("user") }} />
    </Tabs>
  )
}
