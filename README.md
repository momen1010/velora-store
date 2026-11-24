# Velora Store

متجر مستحضرات تجميل بـ React 19 + Vite + Tailwind. الطلبات تُحفظ في Firebase Firestore (الدفع عند الاستلام).

## التشغيل محلياً

```bash
npm install
cp .env.example .env.local   # واملأ قيم Firebase (ملف .env.local لا يُرفع على GitHub)
npm run dev
```

## إعداد Firebase (مرة واحدة)

1. من [Firebase Console](https://console.firebase.google.com) أنشئ مشروعاً، ثم **Build > Firestore Database > Create database** (اختر Production mode، ومنطقة قريبة مثل `europe-west`).
2. **Project settings > Your apps > Web app** وانسخ القيم إلى `.env.local` وإلى Vercel (Settings > Environment Variables) بنفس الأسماء الموجودة في `.env.example`.
3. انشر قواعد الأمان (مهم جداً، بدونها الطلبات ترفض أو الداتا تبقى مفتوحة):
   ```bash
   npx firebase-tools login
   npx firebase-tools deploy --only firestore:rules --project YOUR_PROJECT_ID
   ```
   أو الصق محتوى `firestore.rules` في Firestore > Rules ثم Publish.
4. (موصى به) فعّل **App Check** بمزوّد reCAPTCHA v3 وضع الـ site key في `VITE_RECAPTCHA_SITE_KEY`، ثم فعّل Enforce على Firestore بعد التأكد أن الموقع يعمل.
5. في Google Cloud Console > Credentials، قيّد الـ API key على نطاق موقعك (HTTP referrers) وعلى واجهات Firebase فقط.

## الأمان باختصار

- لا توجد مفاتيح أو أسرار في الكود. مفتاح `apiKey` الخاص بالويب ليس سرّاً بحد ذاته؛ الحماية من `firestore.rules` + App Check.
- الزائر يقدر **ينشئ** طلباً صالحاً فقط. لا يقدر يقرأ أو يعدّل أو يحذف أي طلب (حتى طلبه هو؛ صفحة التأكيد تستخدم نسخة محلية على جهازه).
- القواعد تتحقق من كل حقل: الاسم، رقم الموبايل المصري، المحافظة من القائمة، الكميات، الأسعار، الإجماليات والشحن، `status = pending`، وطريقة الدفع `cod`، والوقت `createdAt` من السيرفر.
- القراءة وتغيير حالة الطلب للأدمن فقط (custom claim `admin: true`). أي مجموعة أخرى مغلقة.
- حد القواعد: 5 أصناف مختلفة كحد أقصى في الطلب الواحد (قيد من Firestore على عدد التعبيرات).
- ما لا تستطيع القواعد منعه: إرسال سبام بطلبات صالحة، أو تغيير الأسعار من المتصفح (الأسعار حالياً من ملفات الواجهة). الحل: App Check الآن، ثم نقل المنتجات إلى Firestore (المرحلة التالية).

## اختبار القواعد

```bash
npm run test:rules   # يشغّل Firestore emulator (يحتاج Java 21+)
```

## الصور

الصور داخل `public/images/` وتُخدم من `/images/...`. أسماء الملفات بدون مسافات أو حروف كبيرة.
