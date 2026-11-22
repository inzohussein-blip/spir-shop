import { Tabs } from "expo-router"
import Icon, { IconName } from "../../components/Icon"
import { useCart } from "../../lib/cart"
import { COLORS, FONTS } from "../../lib/config"

const tabIcon =
  (name: IconName) =>
  ({ focused }: { focused: boolean }) => <Icon name={name} size={22} color={focused ? COLORS.text : "#c4c4c4"} />

/** Icon-only bottom bar, as in the design. Titles stay for accessibility and headers. */
export default function TabsLayout() {
  const { count } = useCart()
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarStyle: { height: 64, borderTopColor: COLORS.border, paddingTop: 6 },
        headerTitleAlign: "center",
        headerTintColor: COLORS.text,
        headerTitleStyle: { fontFamily: FONTS.bold, fontSize: 18 },
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: COLORS.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "الرئيسية", headerTitle: "Spir Shop", tabBarIcon: tabIcon("home") }}
      />
      <Tabs.Screen name="search" options={{ title: "البحث", tabBarIcon: tabIcon("search") }} />
      <Tabs.Screen
        name="cart"
        options={{
          title: "سلتك",
          tabBarIcon: tabIcon("shopping-bag"),
          tabBarBadge: count > 0 ? count : undefined,
          tabBarBadgeStyle: { backgroundColor: COLORS.accent, fontFamily: FONTS.bold, fontSize: 11 },
        }}
      />
    </Tabs>
  )
}
