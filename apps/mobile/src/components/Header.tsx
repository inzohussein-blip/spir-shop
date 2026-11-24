import { useRouter } from "expo-router"
import { ReactNode, useEffect, useState } from "react"
import { Pressable, StyleSheet, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { getNotifications } from "../lib/api"
import { COLORS, IS_NATURAL, SHADOW } from "../lib/config"
import { useDrawer } from "../lib/drawer"
import { useStore } from "../lib/store"
import Icon from "./Icon"
import Text from "./Text"

/** Round white back button with a soft shadow (design: 32px circle). */
export function BackButton({ onPress, light }: { onPress?: () => void; light?: boolean }) {
  const router = useRouter()
  return (
    <Pressable
      onPress={onPress ?? (() => (router.canGoBack() ? router.back() : router.replace("/")))}
      style={[styles.back, light && { backgroundColor: "rgba(255,255,255,0.9)" }]}
      hitSlop={8}
      accessibilityLabel="رجوع"
      testID="header-back"
    >
      {/* RTL: "back" points to the right */}
      <Icon name="chevron-right" size={18} color={COLORS.primaryDark} />
    </Pressable>
  )
}

/** Bell with a red dot when there are notifications the customer hasn't opened. */
/** Round white button around header icons in the "natural" theme. */
function Round({ children }: { children: ReactNode }) {
  return IS_NATURAL ? <View style={styles.round}>{children}</View> : <>{children}</>
}

export function BellButton() {
  const router = useRouter()
  const { address, notificationsSeenAt } = useStore()
  const [unread, setUnread] = useState(false)
  useEffect(() => {
    getNotifications(address?.province)
      .then((list) => setUnread(list.some((n) => new Date(n.sent_at).getTime() > notificationsSeenAt)))
      .catch(() => undefined)
  }, [address?.province, notificationsSeenAt])
  return (
    <Pressable onPress={() => router.push("/notifications")} hitSlop={8} accessibilityLabel="الإشعارات" testID="open-notifications">
      <Round>
        <Icon name="bell" size={IS_NATURAL ? 19 : 21} />
        {unread ? <View style={[styles.unread, IS_NATURAL && { top: 10, end: 11 }]} /> : null}
      </Round>
    </Pressable>
  )
}

export function MenuButton() {
  const { open } = useDrawer()
  return (
    <Pressable onPress={open} hitSlop={8} accessibilityLabel="القائمة" testID="open-menu">
      {IS_NATURAL ? (
        <View style={[styles.round, { gap: 4 }]}>
          <View style={[styles.bar, { width: 17 }]} />
          <View style={[styles.bar, { width: 17 }]} />
          <View style={[styles.bar, { width: 17 }]} />
        </View>
      ) : (
        <View style={{ gap: 5, paddingVertical: 4 }}>
          <View style={[styles.bar, { width: 20 }]} />
          <View style={[styles.bar, { width: 14 }]} />
          <View style={[styles.bar, { width: 20 }]} />
        </View>
      )}
    </Pressable>
  )
}

/**
 * Screen header from the design:
 *  - "menu": ☰  · centered title ·  bell     (top-level screens)
 *  - "back": (‹) · centered title ·  [right]  (pushed screens)
 */
export default function Header({
  title,
  variant = "back",
  right,
  onBack,
}: {
  title?: string
  variant?: "menu" | "back"
  right?: ReactNode
  onBack?: () => void
}) {
  const insets = useSafeAreaInsets()
  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 12 }]}>
      <View style={styles.side}>{variant === "menu" ? <MenuButton /> : <BackButton onPress={onBack} />}</View>
      <Text style={styles.title} numberOfLines={1}>
        {title ?? ""}
      </Text>
      <View style={[styles.side, { alignItems: "flex-end" }]}>{right === undefined && variant === "menu" ? <BellButton /> : right}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", paddingHorizontal: IS_NATURAL ? 20 : 24, paddingBottom: 14, backgroundColor: "transparent" },
  side: { width: 52, alignItems: "flex-start" },
  title: { flex: 1, textAlign: "center", fontSize: IS_NATURAL ? 18 : 19, fontWeight: "700", color: COLORS.primaryDark },
  round: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.card, alignItems: "center", justifyContent: "center", ...SHADOW, shadowOpacity: 0.06 },
  back: {
    width: IS_NATURAL ? 42 : 34,
    height: IS_NATURAL ? 42 : 34,
    borderRadius: IS_NATURAL ? 21 : 17,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    ...SHADOW,
    shadowOpacity: 0.12,
    elevation: 3,
  },
  bar: { height: 2, borderRadius: 1, backgroundColor: COLORS.primaryDark },
  unread: {
    position: "absolute",
    top: -1,
    end: -1,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ff6464",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
})
