import { Tabs } from "expo-router"
import { StyleSheet, View } from "react-native"
import Icon, { IconName } from "../../components/Icon"
import Text from "../../components/Text"
import { useCart } from "../../lib/cart"
import { COLORS } from "../../lib/config"

const ACTIVE = COLORS.primaryDark
const INACTIVE = "#c4c4c8"

function TabIcon({ name, focused, badge }: { name: IconName; focused: boolean; badge?: number }) {
  return (
    <View>
      <Icon name={name} size={23} color={focused ? ACTIVE : INACTIVE} />
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 9 ? "9+" : badge}</Text>
        </View>
      ) : null}
    </View>
  )
}

/** Bottom bar from the design: four icons, no labels, rounded top edge. */
export default function TabsLayout() {
  const { count } = useCart()
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.bar,
        sceneStyle: { backgroundColor: COLORS.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "الرئيسية", tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} /> }} />
      <Tabs.Screen name="search" options={{ title: "اكتشفي", tabBarIcon: ({ focused }) => <TabIcon name="search" focused={focused} /> }} />
      <Tabs.Screen
        name="cart"
        options={{ title: "السلة", tabBarIcon: ({ focused }) => <TabIcon name="shopping-bag" focused={focused} badge={count} /> }}
      />
      <Tabs.Screen name="account" options={{ title: "حسابي", tabBarIcon: ({ focused }) => <TabIcon name="user" focused={focused} /> }} />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  bar: {
    height: 72,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  badge: {
    position: "absolute",
    top: -5,
    end: -9,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "700", textAlign: "center" },
})
