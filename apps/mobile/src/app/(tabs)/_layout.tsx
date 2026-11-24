import { Tabs } from "expo-router"
import type { ComponentProps } from "react"
import { Pressable, StyleSheet, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Icon, { IconName } from "../../components/Icon"
import Text from "../../components/Text"
import { useCart } from "../../lib/cart"
import { COLORS, IS_NATURAL, SHADOW } from "../../lib/config"

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>["tabBar"]>>[0]
type BottomTabBarProps = TabBarProps & {
  navigation: { emit: (e: { type: "tabPress"; target: string; canPreventDefault: true }) => { defaultPrevented: boolean }; navigate: (name: string) => void }
}

const ICONS: Record<string, IconName> = { index: "home", search: "search", cart: "shopping-bag", account: "user" }
const INACTIVE = IS_NATURAL ? COLORS.primaryDark : "#c4c4c8"

function Badge({ n }: { n: number }) {
  if (!n) return null
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{n > 9 ? "9+" : n}</Text>
    </View>
  )
}

/**
 * "natural" theme: floating white pill; the selected tab becomes a soft green
 * pill with a green circle icon and its name.
 */
function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()
  const { count } = useCart()
  return (
    <View style={[styles.floatWrap, { paddingBottom: insets.bottom + 12 }]}>
      <View style={styles.float}>
        {state.routes.map((route, i) => {
          const focused = state.index === i
          const label = descriptors[route.key].options.title ?? route.name
          const onPress = () => {
            const e = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true })
            if (!focused && !e.defaultPrevented) navigation.navigate(route.name)
          }
          return focused ? (
            <Pressable key={route.key} onPress={onPress} style={styles.active} testID={`tab-${route.name}`}>
              <View style={styles.activeIcon}>
                <Icon name={ICONS[route.name]} size={17} color="#fff" />
              </View>
              <Text style={styles.activeText}>{label}</Text>
            </Pressable>
          ) : (
            <Pressable key={route.key} onPress={onPress} style={styles.item} hitSlop={6} accessibilityLabel={label} testID={`tab-${route.name}`}>
              <Icon name={ICONS[route.name]} size={22} color={INACTIVE} />
              {route.name === "cart" ? <Badge n={count} /> : null}
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

function TabIcon({ name, focused, badge }: { name: IconName; focused: boolean; badge?: number }) {
  return (
    <View>
      <Icon name={name} size={23} color={focused ? COLORS.primaryDark : INACTIVE} />
      <Badge n={badge ?? 0} />
    </View>
  )
}

/** Bottom bar: four icons (home, discover, cart, profile). Look depends on the theme. */
export default function TabsLayout() {
  const { count } = useCart()
  return (
    <Tabs
      tabBar={IS_NATURAL ? (props) => <FloatingTabBar {...(props as BottomTabBarProps)} /> : undefined}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.bar,
        sceneStyle: { backgroundColor: COLORS.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "الرئيسية", tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} /> }} />
      <Tabs.Screen name="search" options={{ title: "اكتشفي", tabBarIcon: ({ focused }) => <TabIcon name="search" focused={focused} /> }} />
      <Tabs.Screen name="cart" options={{ title: "السلة", tabBarIcon: ({ focused }) => <TabIcon name="shopping-bag" focused={focused} badge={count} /> }} />
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
  floatWrap: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 20 },
  float: {
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.card,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 8,
    ...SHADOW,
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 10,
  },
  item: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  active: { flexDirection: "row", alignItems: "center", gap: 8, height: 46, borderRadius: 23, backgroundColor: "#eef5dc", paddingStart: 6, paddingEnd: 16 },
  activeIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  activeText: { fontSize: 14, fontWeight: "700" },
})
