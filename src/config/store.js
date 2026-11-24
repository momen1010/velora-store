// إعدادات المتجر من متغيرات البيئة (Vercel > Settings > Environment Variables).
// لا توجد أرقام مكتوبة في الكود.
const env = import.meta.env;
const digits = (v) => String(v ?? "").replace(/\D/g, "");

// رقم واتساب المتجر بالصيغة الدولية بدون + (مثال: 201012345678). ممكن يكتب 01012345678 ونحوّله.
const toIntl = (v) => {
  const d = digits(v);
  if (/^01[0125]\d{8}$/.test(d)) return `2${d}`;
  return d;
};
const wa = toIntl(env.VITE_WHATSAPP_NUMBER);
export const WHATSAPP_NUMBER = wa.length >= 10 && wa.length <= 15 ? wa : "";

// رقم محفظة اتصالات كاش (11 رقم، يبدأ بـ 011). ممكن يكتب 2011... ونحوّله.
const w = digits(env.VITE_WALLET_NUMBER).replace(/^20/, "0");
export const WALLET_NUMBER = /^01[0125]\d{8}$/.test(w) ? w : "";
export const WALLET_NAME = "اتصالات كاش";
