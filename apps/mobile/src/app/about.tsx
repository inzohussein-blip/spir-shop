import { useLocalSearchParams } from "expo-router"
import { ScrollView, StyleSheet, View } from "react-native"
import Header from "../components/Header"
import Text from "../components/Text"
import { COLORS } from "../lib/config"

const SECTIONS = {
  about: {
    title: "من نحن",
    body: "Spir Shop متجر عراقي لمنتجات العناية بالبشرة والشعر والمكياج. نوفر منتجات أصلية من علامات عالمية، ونوصل لكل المحافظات، والدفع نقداً عند الاستلام.",
  },
  terms: {
    title: "الشروط والأحكام",
    body: "• الأسعار بالدينار العراقي وتشمل الضريبة.\n• يتم تأكيد كل طلب بالهاتف قبل الشحن.\n• الدفع نقداً للمندوب عند الاستلام.\n• تقدرين ترفضين الطلب عند الاستلام إذا المنتج تالف أو مختلف عن الطلب.\n• المنتجات المفتوحة أو المستخدمة لا تُرجع لأسباب صحية.",
  },
  privacy: {
    title: "سياسة الخصوصية",
    body: "نستخدم اسمك ورقم هاتفك وعنوانك لتوصيل طلباتك والتواصل معك فقط، ولا نشاركها مع أي جهة غير شركة التوصيل. عناوينك ومفضلتك محفوظة على جهازك، وتقدرين تمسحينها من «حسابي».",
  },
}

/** About, terms and privacy (linked from settings, the side menu and checkout). */
export default function AboutScreen() {
  const { section } = useLocalSearchParams<{ section?: keyof typeof SECTIONS }>()
  const order = section && SECTIONS[section] ? [section, ...Object.keys(SECTIONS).filter((k) => k !== section)] : Object.keys(SECTIONS)
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <Header title={section && SECTIONS[section] ? SECTIONS[section].title : "من نحن"} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, gap: 26 }}>
        {order.map((k) => {
          const s = SECTIONS[k as keyof typeof SECTIONS]
          return (
            <View key={k} style={{ gap: 8 }}>
              <Text style={styles.h}>{s.title}</Text>
              <Text style={styles.p}>{s.body}</Text>
            </View>
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  h: { fontSize: 17, fontWeight: "700" },
  p: { fontSize: 14, lineHeight: 24, color: "#4a4a4e" },
})
