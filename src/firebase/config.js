// src/firebase/config.js
// إعدادات Firebase تُقرأ من متغيرات البيئة (VITE_*) ولا تُكتب في الكود.
// ملاحظة: مفتاح apiKey الخاص بتطبيقات الويب ليس سرّاً؛ الحماية الحقيقية
// تأتي من firestore.rules ومن App Check. راجع README.
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const env = import.meta.env;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
);

let app = null;
let db = null;

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);

  // App Check (reCAPTCHA v3): يمنع الطلبات القادمة من خارج موقعك. يتفعّل فقط
  // لو أضفت VITE_RECAPTCHA_SITE_KEY. لا يوجد مفتاح سرّي في الكود.
  const siteKey = env.VITE_RECAPTCHA_SITE_KEY;
  if (siteKey) {
    import("firebase/app-check").then(({ initializeAppCheck, ReCaptchaV3Provider }) => {
      if (env.DEV && env.VITE_APPCHECK_DEBUG_TOKEN) {
        self.FIREBASE_APPCHECK_DEBUG_TOKEN = env.VITE_APPCHECK_DEBUG_TOKEN;
      }
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(siteKey),
        isTokenAutoRefreshEnabled: true,
      });
    });
  }

  db = getFirestore(app);
}

export { app, db };
