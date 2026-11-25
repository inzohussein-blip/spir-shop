import { Alert, Platform } from "react-native"

/** Yes/no question; resolves true on "yes". Uses the browser's confirm() on the web build. */
export function confirmAsk(message: string, yes = "نعم"): Promise<boolean> {
  if (Platform.OS === "web") return Promise.resolve(window.confirm(message))
  return new Promise((resolve) => {
    Alert.alert("تأكيد", message, [
      { text: "إلغاء", style: "cancel", onPress: () => resolve(false) },
      { text: yes, style: "destructive", onPress: () => resolve(true) },
    ], { cancelable: true, onDismiss: () => resolve(false) })
  })
}
