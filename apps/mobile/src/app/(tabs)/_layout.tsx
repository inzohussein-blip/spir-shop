import { Tabs } from "expo-router"
import Text from "../../components/Text"
import { useCart } from "../../lib/cart"
import { COLORS } from "../../lib/config"

const Icon = ({ emoji }: { emoji: string }) => <Text style={{ fontSize: 20 }}>{emoji}</Text>

export default function TabsLayout() {
  const { count } = useCart()
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        headerTitleAlign: "center",
        headerTintColor: COLORS.primaryDark,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "الرئيسية", headerTitle: "Spir Shop", tabBarIcon: () => <Icon emoji="🏠" /> }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "السلة",
          tabBarIcon: () => <Icon emoji="🛍️" />,
          tabBarBadge: count > 0 ? count : undefined,
        }}
      />
    </Tabs>
  )
}
