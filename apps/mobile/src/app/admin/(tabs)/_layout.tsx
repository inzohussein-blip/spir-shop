import { Tabs } from "expo-router"
import { Platform } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Icon, { IconName } from "../../../components/Icon"
import { COLORS, FONTS } from "../../../lib/config"

const TABS: { name: string; title: string; icon: IconName }[] = [
  { name: "index", title: "الرئيسية", icon: "grid" },
  { name: "orders", title: "الطلبات", icon: "package" },
  { name: "products", title: "المنتجات", icon: "tag" },
  { name: "ads", title: "الإعلانات", icon: "image" },
  { name: "more", title: "المزيد", icon: "menu" },
]

export default function AdminTabs() {
  const insets = useSafeAreaInsets()
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: "#a0a0a6",
        tabBarLabelStyle: { fontFamily: FONTS.medium, fontSize: 11 },
        tabBarStyle: { height: 62 + insets.bottom, paddingTop: 6, paddingBottom: Platform.OS === "web" ? 8 : insets.bottom + 6 },
      }}
    >
      {TABS.map((t) => (
        <Tabs.Screen key={t.name} name={t.name} options={{ title: t.title, tabBarIcon: ({ color }) => <Icon name={t.icon} size={22} color={String(color)} /> }} />
      ))}
    </Tabs>
  )
}
