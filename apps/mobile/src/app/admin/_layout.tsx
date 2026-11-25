import { Redirect, Stack } from "expo-router"
import { useState } from "react"
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Button from "../../components/Button"
import Text from "../../components/Text"
import { ErrorBox, Field, Loading } from "../../components/admin/ui"
import { AdminSessionProvider, useAdmin } from "../../lib/admin"
import { COLORS } from "../../lib/config"
import { IS_ADMIN_APP } from "../../lib/variant"

function Login() {
  const { login } = useAdmin()
  const insets = useSafeAreaInsets()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      await login(email, password)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#fff" }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={[styles.login, { paddingTop: insets.top + 64 }]} keyboardShouldPersistTaps="handled">
        <View style={styles.logo}>
          <Text style={{ fontSize: 30, fontWeight: "700", color: COLORS.onPrimary }}>S</Text>
        </View>
        <Text style={styles.title}>إدارة المتجر</Text>
        <Text style={styles.subtitle}>الطلبات، المنتجات والإعلانات من هاتفك</Text>
        <View style={{ gap: 14, width: "100%" }}>
          <Field label="البريد الإلكتروني" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" testID="login-email" />
          <Field label="كلمة المرور" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" onSubmitEditing={submit} testID="login-password" />
          {error ? <ErrorBox message={error} /> : null}
          <Button label="دخول" onPress={submit} loading={busy} disabled={!email || !password} testID="login-submit" />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function Gate() {
  const { ready, token, tenant } = useAdmin()
  if (!ready) return <Loading />
  if (!token || !tenant) return <Login />
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#f5f5f7" } }} />
}

/** The store manager's app. Only reachable in the admin build (APP_VARIANT=admin). */
export default function AdminLayout() {
  if (!IS_ADMIN_APP) return <Redirect href="/" />
  return (
    <AdminSessionProvider>
      <Gate />
    </AdminSessionProvider>
  )
}

const styles = StyleSheet.create({
  login: { flexGrow: 1, alignItems: "center", paddingHorizontal: 24, gap: 10, paddingBottom: 40 },
  logo: { width: 72, height: 72, borderRadius: 22, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  title: { fontSize: 24, fontWeight: "700" },
  subtitle: { color: COLORS.muted, marginBottom: 24 },
})
