import { usePathname, useRouter } from "expo-router"
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { Animated, Dimensions, Pressable, StyleSheet, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Icon, { IconName } from "../components/Icon"
import Text from "../components/Text"
import { COLORS, IS_NATURAL } from "./config"
import { useStore } from "./store"

const DrawerContext = createContext<{ open: () => void; close: () => void }>({ open: () => undefined, close: () => undefined })
export const useDrawer = () => useContext(DrawerContext)

type Item = { label: string; icon: IconName; href: string; match?: (p: string) => boolean }
const MAIN: Item[] = [
  { label: "الرئيسية", icon: "home", href: "/", match: (p) => p === "/" },
  { label: "اكتشفي", icon: "search", href: "/search" },
  { label: "طلباتي", icon: "shopping-bag", href: "/orders" },
  { label: "حسابي", icon: "user", href: "/account" },
]
const OTHER: Item[] = [
  { label: "الإعدادات", icon: "settings", href: "/settings" },
  { label: "الدعم", icon: "mail", href: "/support" },
  { label: "من نحن", icon: "info", href: "/about" },
]

/** Side menu (design: "sidebar-home"): profile on top, main pages, then "other". */
export function DrawerProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false)
  const x = useRef(new Animated.Value(0)).current
  const router = useRouter()
  const pathname = usePathname()
  const insets = useSafeAreaInsets()
  const { address } = useStore()
  const width = Math.min(Dimensions.get("window").width * 0.78, 320)

  const open = useCallback(() => setVisible(true), [])
  const close = useCallback(() => {
    Animated.timing(x, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => setVisible(false))
  }, [x])

  useEffect(() => {
    if (visible) Animated.timing(x, { toValue: 1, duration: 220, useNativeDriver: true }).start()
  }, [visible, x])

  const go = (href: string) => {
    close()
    setTimeout(() => router.navigate(href as never), 120)
  }

  const row = (it: Item) => {
    const active = it.match ? it.match(pathname) : pathname.startsWith(it.href)
    return (
      <Pressable key={it.href} onPress={() => go(it.href)} style={[styles.item, active && styles.itemActive]} testID={`menu-${it.href.slice(1) || "home"}`}>
        <Icon name={it.icon} size={19} color={active ? COLORS.primaryDark : COLORS.muted} />
        <Text style={[styles.itemText, active && { color: COLORS.primaryDark, fontWeight: "700" }]}>{it.label}</Text>
      </Pressable>
    )
  }

  const value = useMemo(() => ({ open, close }), [open, close])
  const name = address ? `${address.firstName} ${address.lastName}`.trim() : "أهلاً بك"

  return (
    <DrawerContext.Provider value={value}>
      {children}
      {visible ? (
        <View style={StyleSheet.absoluteFill}>
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.35)", opacity: x }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={close} testID="menu-backdrop" />
          </Animated.View>
          <Animated.View
            style={[
              styles.panel,
              { width, paddingTop: insets.top + 36, paddingBottom: insets.bottom + 24 },
              // RTL: the panel lives on the right edge and slides in from there
              { transform: [{ translateX: x.interpolate({ inputRange: [0, 1], outputRange: [width, 0] }) }] },
            ]}
          >
            <View style={styles.profile}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{address?.firstName?.[0] ?? "S"}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name} numberOfLines={1}>{name}</Text>
                <Text style={styles.sub} numberOfLines={1}>{address?.phone ?? "Spir Shop"}</Text>
              </View>
            </View>
            <View style={{ gap: 4, marginTop: 34 }}>{MAIN.map(row)}</View>
            <Text style={styles.section}>أخرى</Text>
            <View style={{ gap: 4 }}>{OTHER.map(row)}</View>
          </Animated.View>
        </View>
      ) : null}
    </DrawerContext.Provider>
  )
}

const styles = StyleSheet.create({
  panel: {
    position: "absolute",
    top: 0,
    bottom: 0,
    // "start" = right edge in RTL (native swaps left/right, web follows dir="rtl")
    start: 0,
    backgroundColor: COLORS.card,
    borderTopEndRadius: 30,
    borderBottomEndRadius: 30,
    paddingHorizontal: 14,
  },
  profile: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 12 },
  avatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: "#f2a1a1", alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 22, fontWeight: "700", color: "#fff" },
  name: { fontSize: 16, fontWeight: "700" },
  sub: { fontSize: 12, color: COLORS.muted, marginTop: 2, textAlign: "left" },
  item: { flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 16, height: 48, borderRadius: 10 },
  itemActive: { backgroundColor: IS_NATURAL ? "#eef5dc" : "#f3f3f3" },
  itemText: { fontSize: 15, color: COLORS.muted, fontWeight: "500" },
  section: { fontSize: 13, color: COLORS.muted, marginTop: 28, marginBottom: 8, paddingHorizontal: 16 },
})
