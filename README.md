# Spir Shop — متجر كوزمتك ومنتجات عناية

متجر إلكتروني مفتوح المصدر بالكامل وتحت سيطرتك، مبني على **MedusaJS v2** (الخلفية + لوحة التحكم) و **Next.js** (متجر الويب / PWA / تطبيق تلكرام المصغّر).
مهيأ للسوق العراقي: الدينار العراقي، الدفع عند الاستلام، التوصيل حسب المحافظة، وواجهة عربية RTL.

```
apps/
├── backend/      Medusa: API + لوحة التحكم (/app) + بوت تلكرام + كتالوج ميتا
└── storefront/   Next.js: متجر الويب (PWA) + Telegram Mini App
```

## ما الموجود حالياً

| الميزة | المكان |
|---|---|
| منطقة العراق، عملة IQD، الدفع عند الاستلام، توصيل بغداد (5,000) والمحافظات (7,000)، أقسام الكوزمتك ومنتجات تجريبية | `apps/backend/src/migration-scripts/initial-data-seed.ts` |
| إشعار تلكرام بكل طلب جديد (الاسم، الهاتف، العنوان، المنتجات، المجموع) | `apps/backend/src/subscribers/order-placed-telegram.ts` |
| بوت تلكرام: رسالة ترحيب + زر يفتح المتجر داخل تلكرام | `apps/backend/src/api/telegram/webhook/route.ts` |
| كتالوج فيسبوك/إنستغرام (XML) يتحدّث تلقائياً | `GET /feeds/meta` ← `apps/backend/src/api/feeds/meta/route.ts` |
| واجهة عربية RTL، أسعار بصيغة `25,000 د.ع`، حقل المحافظة كقائمة، الهاتف إجباري | `apps/storefront/src` |
| PWA (إضافة للشاشة الرئيسية) | `apps/storefront/src/app/manifest.ts` |
| دعم Telegram Mini App | `apps/storefront/src/lib/telegram/telegram-mini-app.tsx` |

## التشغيل محلياً

المتطلبات: Node 22.23+، PostgreSQL 15+، Redis.

```bash
npm install

# 1) الخلفية
cd apps/backend
cp .env.template .env            # عدّل DATABASE_URL وباقي القيم
npx medusa db:migrate            # ينشئ الجداول + بيانات العراق والمنتجات التجريبية
npx medusa user -e you@example.com -p 'كلمة-سر-قوية'
npm run dev                      # http://localhost:9000/app  ← لوحة التحكم

# 2) المتجر (في نافذة ثانية)
cd apps/storefront
cp .env.template .env.local
# ضع NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY من لوحة التحكم: Settings → Publishable API Keys
# NEXT_PUBLIC_DEFAULT_REGION=iq
npm run dev                      # http://localhost:8000
```

## ربط بوت تلكرام

1. افتح [@BotFather](https://t.me/BotFather) ← `/newbot` واحفظ التوكن.
2. لمعرفة `TELEGRAM_ADMIN_CHAT_ID`: أرسل رسالة للبوت (أو أضفه لمجموعة الموظفين)، ثم افتح
   `https://api.telegram.org/bot<TOKEN>/getUpdates` وخذ قيمة `chat.id`.
3. في `apps/backend/.env`:
   ```
   TELEGRAM_BOT_TOKEN=...
   TELEGRAM_ADMIN_CHAT_ID=...
   TELEGRAM_WEBHOOK_SECRET=أي-نص-عشوائي-طويل
   BACKEND_PUBLIC_URL=https://api.yourdomain.com
   STOREFRONT_URL=https://yourdomain.com
   ```
4. بعد النشر على HTTPS شغّل مرة وحدة:
   ```bash
   cd apps/backend && npx medusa exec ./src/scripts/telegram-setup.ts
   ```
   يسجّل الـ webhook ويضيف زر «المتجر» في قائمة البوت ليفتح المتجر كتطبيق مصغّر.

تجربة شكل رسالة الطلب بدون بوت حقيقي:
`npx medusa exec ./src/scripts/dev/test-telegram-notification.ts`

## ربط فيسبوك وإنستغرام (Meta Catalog)

1. أنشئ حساب [Meta Business](https://business.facebook.com) واربط صفحة الفيسبوك وحساب إنستغرام التجاري.
2. Commerce Manager ← Catalog ← Data sources ← **Data feed** ← Scheduled feed.
3. الرابط: `https://api.yourdomain.com/feeds/meta` — التحديث كل ساعة.

> ⚠️ ميزة وسم المنتجات في المنشورات ومتجر إنستغرام قد لا تكون مفعّلة للحسابات في العراق. حتى بدونها، الكتالوج يُستخدم لإعلانات الكتالوج الديناميكية (Advantage+ Catalog Ads).
> كل منتج يحتاج صورة حتى يقبله ميتا — أضف الصور من لوحة التحكم.

## النشر (مقترح)

- سيرفر VPS بذاكرة 2GB أو أكثر (مثل Hetzner أو DigitalOcean): PostgreSQL + Redis + الخلفية + المتجر، وخلفهم Caddy أو Nginx لشهادات HTTPS.
- غيّر `JWT_SECRET` و `COOKIE_SECRET` لقيم عشوائية طويلة، وحدّث `STORE_CORS` و `ADMIN_CORS` و `AUTH_CORS` بالدومينات الحقيقية.
- صور المنتجات: الإعداد الافتراضي يخزنها محلياً. للإنتاج يُنصح بـ S3 أو Cloudflare R2 (موديول `@medusajs/file-s3`).

## المراحل القادمة

- [ ] تطبيق الموبايل (Expo / React Native) لأندرويد وآيفون مع إشعارات Push
- [ ] الدفع الإلكتروني: زين كاش، FIB، Qi Card (Payment Module مخصص)
- [ ] ردود تلقائية على رسائل إنستغرام وماسنجر
- [ ] تسجيل الدخول برقم الهاتف (OTP)
