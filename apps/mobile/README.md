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
