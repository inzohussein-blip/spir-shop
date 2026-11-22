# تطبيق Spir Shop (أندرويد + آيفون)

تطبيق Expo / React Native متصل بنفس خلفية Medusa. يحتوي على: الرئيسية مع البحث والأقسام، صفحة المنتج مع اختيار الحجم، السلة، إتمام الطلب بالدفع عند الاستلام (المحافظة من قائمة، والتوصيل يُختار تلقائياً: بغداد أو المحافظات)، و**نظام تحديثات** على مستويين.

## التشغيل للتطوير

```bash
cd apps/mobile
cp .env.example .env    # ضع رابط الخلفية والـ Publishable Key
npx expo start          # امسح الـ QR بتطبيق Expo Go أو شغّل على المحاكي
```

> على الهاتف لا يعمل `localhost`؛ استخدم عنوان IP جهازك على الشبكة (مثلاً `http://192.168.1.10:9000`) أو رابط HTTPS للسيرفر.

## نظام التحديثات 🔄

### 1) تحديثات فورية OTA (بدون متجر التطبيقات)
أي تعديل على الواجهة أو النصوص أو المنطق (كود JavaScript) يوصل للمستخدمين **مباشرة** بدون مراجعة Google أو Apple:

```bash
npm run update:production -- --message "تحسين صفحة المنتج"
```

التطبيق يفحص التحديثات عند كل فتح وكل ما يرجع للواجهة (كل 15 دقيقة كحد أقصى). يحمّل التحديث بالخلفية، وبعدها يظهر شريط «تحديث جديد جاهز ← إعادة التشغيل». الكود في `src/lib/updates.ts` (الدالة `useOtaUpdate`).

### 2) تحديث النسخة من المتجر (نسخة Native جديدة)
لما تغيّر شي يحتاج بناء جديد (مكتبة Native، صلاحيات، نسخة Expo SDK)، ارفع النسخة الجديدة على المتاجر، وبعدها من **لوحة التحكم ← Settings ← Store ← Metadata** أضف المفاتيح التالية:

| المفتاح | مثال | التأثير |
|---|---|---|
| `mobile_latest_version` | `1.1.0` | النسخ الأقدم تشوف نافذة «نسخة جديدة متوفرة» مع زر «لاحقاً» (تنعرض مرة وحدة لكل نسخة) |
| `mobile_min_version` | `1.0.0` | النسخ الأقدم **تنقفل** وما تشتغل إلا بعد التحديث (للتغييرات الإجبارية) |
| `mobile_android_url` | رابط Google Play | وين يودّي زر «تحديث» على أندرويد |
| `mobile_ios_url` | رابط App Store | وين يودّي زر «تحديث» على آيفون |
| `mobile_update_message` | `أضفنا الدفع بزين كاش!` | نص مخصص يظهر داخل النافذة (اختياري) |

التطبيق يقرأ هذه القيم من `GET /store/mobile-version` (في `apps/backend/src/api/store/mobile-version/route.ts`). إذا فشل الفحص (مثلاً ما في إنترنت) التطبيق يكمل طبيعي وما ينقفل.

## البناء والنشر على المتاجر

```bash
npm install -g eas-cli
eas login
eas init                 # يربط المشروع بحساب Expo ويضيف projectId
eas update:configure     # يضيف رابط التحديثات (updates.url) في app.json

npm run build:apk        # APK للتجربة على أندرويد
npm run build:android    # نسخة Google Play (AAB)
npm run build:ios        # نسخة App Store (بدون جهاز Mac)
eas submit -p android    # رفع على Google Play
eas submit -p ios        # رفع على App Store
```

**قبل كل نسخة جديدة على المتجر:** ارفع `version` في `app.json` (مثلاً من `1.0.0` إلى `1.1.0`) وزِد `android.versionCode`.
`runtimeVersion` مضبوط على سياسة `appVersion`، يعني تحديثات OTA تروح فقط للنسخ اللي تحمل نفس الرقم. هذا يمنع وصول كود JavaScript جديد لتطبيق ما يملك المكتبات اللي يحتاجها.

## بناء APK وتوزيعه بدون Google Play

### المتطلبات (مرة وحدة)
- JDK 17، و Android SDK فيه: `platforms;android-37.0`، `build-tools;37.0.0`، `ndk;27.1.12297006`، `cmake;3.22.1`.
- **مفتاح التوقيع:** `credentials/spir-release.jks` و `credentials/keystore.properties`. هذين الملفين **مو** بـ git.
  > ⚠️ احتفظ بنسخة احتياطية منهم بمكان آمن. Android ما يقبل تحديث تطبيق إلا إذا كان موقّع بنفس المفتاح، فإذا ضاع المفتاح لازم الزبائن يحذفون التطبيق وينزلوه من جديد.
  - `keystore.properties` يحتوي على: `SPIR_RELEASE_STORE_FILE` (المسار الكامل للمفتاح)، `SPIR_RELEASE_STORE_PASSWORD`، `SPIR_RELEASE_KEY_ALIAS`، `SPIR_RELEASE_KEY_PASSWORD`.

### البناء
```bash
cd apps/mobile
ANDROID_HOME=/path/to/android-sdk ./scripts/build-apk.sh
# الناتج: dist/spir-shop-<version>.apk
```
الأمر يعيد توليد مجلد `android/` من `app.json` وإضافاته (`plugins/with-release-signing.js`). لا تعدّل `android/` يدوياً.

### نشر تحديث للزبائن (من داخل التطبيق)
1. ارفع `version` في `app.json` (مثلاً `1.0.0` إلى `1.1.0`) وزِد `android.versionCode` بواحد.
2. ابنِ الـ APK بالأمر أعلاه.
3. من لوحة التحكم ← **تحديثات التطبيق**: ارفع الملف، واكتب رقم النسخة، وحدد إذا التحديث إجباري، واضغط «نشر التحديث».
4. التطبيقات المثبتة تكتشف التحديث عند الفتح، فتظهر نافذة «نسخة جديدة متوفرة» (أو شاشة قفل إذا التحديث إجباري). زر «تحديث» يحمّل الملف داخل التطبيق ويفتح شاشة التثبيت. أول مرة، Android يطلب السماح بـ «تثبيت تطبيقات من هذا المصدر».

### عنوان الخادم
عنوان الخادم يُحدد وقت البناء من `EXPO_PUBLIC_MEDUSA_BACKEND_URL` في `.env`. للتجربة قبل النشر تقدر تغيّره من داخل التطبيق: أيقونة الإعدادات أعلى الرئيسية ← «إعدادات الخادم»، وتكتب مثلاً `http://192.168.1.10:9000` (عنوان جهازك على نفس شبكة Wi-Fi).
> الاتصال بـ HTTP غير المشفّر مفعّل حالياً (`usesCleartextTraffic`) لهذه التجربة. بعد ما تنشر الخادم على HTTPS، احذف هذا الإعداد من `app.json`.

## الصفحة الرئيسية الديناميكية
الصفحة الرئيسية تُبنى من التصميم المنشور في «مصمم التطبيق» بلوحة التحكم (`src/lib/layout.ts` و `src/sdui/`). لا تعدّل `src/app/(tabs)/index.tsx` لتغيير الأقسام؛ غيّرها من المصمم. التفاصيل في `README.md` الرئيسي.

## الملفات

```
src/
├── app/                    الشاشات (Expo Router)
│   ├── (tabs)/index.tsx    الرئيسية
│   ├── (tabs)/cart.tsx     السلة
│   ├── product/[handle]    صفحة المنتج
│   ├── checkout.tsx        إتمام الطلب
│   └── order/[id].tsx      تأكيد الطلب
├── components/
│   ├── UpdatePrompts.tsx   واجهات التحديث (إجباري / اختياري / OTA)
│   └── ProductCard.tsx, Text.tsx
└── lib/
    ├── api.ts              عميل Medusa Store API
    ├── cart.tsx            السلة والطلب (الدفع عند الاستلام)
    ├── updates.ts          منطق التحديثات
    └── config.ts, format.ts
```
