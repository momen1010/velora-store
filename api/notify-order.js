// Vercel Serverless Function: يرسل إشعار تليجرام لصاحب المتجر عند كل طلب جديد.
// المتغيرات (Vercel env): TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, NOTIFIER_EMAIL, NOTIFIER_PASSWORD, VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID
// الأمان: الدالة لا تثق بما يرسله المتصل. تستلم معرّف الطلب فقط، وتقرأ الطلب من Firestore بحساب خدمي (دور notifier)،
// فلا يصل إشعار إلا لطلب حقيقي موجود، ومرة واحدة فقط لكل طلب (مستند orderNotifications/{id} يُنشأ مرة واحدة).
const ORDER_ID_RE = /^GLW-[A-Z0-9]{6,16}$/;
const PAYMENT = { cod: "الدفع عند الاستلام", wallet: "محفظة إلكترونية" };

const esc = (v) => String(v ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
const num = (n) => Number(n).toLocaleString("en-US");

async function signIn(apiKey) {
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: process.env.NOTIFIER_EMAIL, password: process.env.NOTIFIER_PASSWORD, returnSecureToken: true }),
  });
  if (!r.ok) throw new Error(`auth ${r.status}`);
  return (await r.json()).idToken;
}

const val = (f) => (f == null ? undefined : f.stringValue ?? (f.integerValue != null ? Number(f.integerValue) : f.doubleValue ?? f.booleanValue ?? (f.mapValue ? Object.fromEntries(Object.entries(f.mapValue.fields ?? {}).map(([k, v]) => [k, val(v)])) : f.arrayValue ? (f.arrayValue.values ?? []).map(val) : null)));

export function formatMessage(o, id, host) {
  const items = (o.items ?? []).map((i) => `• ${esc(i.name)}${i.shade?.name ? ` (${esc(i.shade.name)})` : ""} × ${i.quantity} = ${num(i.price * i.quantity)} ج.م`).join("\n");
  const c = o.customer ?? {};
  return [
    `🛍 <b>طلب جديد ${esc(id)}</b>`,
    "",
    items,
    "",
    o.discount ? `خصم (${esc(o.promoCode)}): -${num(o.discount)} ج.م` : null,
    `الشحن: ${num(o.shipping)} ج.م`,
    `<b>الإجمالي: ${num(o.total)} ج.م</b>`,
    `الدفع: ${esc(PAYMENT[o.paymentMethod] ?? o.paymentMethod)}${o.walletSender ? ` (من ${esc(o.walletSender)})` : ""}`,
    "",
    `👤 ${esc(c.name)}`,
    `📞 ${esc(c.phone)}`,
    `📍 ${esc(c.governorate)} - ${esc(c.city)}`,
    c.notes ? `📝 ${esc(c.notes)}` : null,
    "",
    `https://${host}/admin/orders`,
  ].filter((x) => x !== null).join("\n");
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  const orderId = typeof req.body === "string" ? (() => { try { return JSON.parse(req.body)?.orderId; } catch { return null; } })() : req.body?.orderId;
  if (typeof orderId !== "string" || !ORDER_ID_RE.test(orderId)) return res.status(400).json({ ok: false });

  const { TELEGRAM_BOT_TOKEN: bot, TELEGRAM_CHAT_ID: chat, VITE_FIREBASE_API_KEY: apiKey, VITE_FIREBASE_PROJECT_ID: project } = process.env;
  if (!bot || !chat || !apiKey || !project || !process.env.NOTIFIER_EMAIL || !process.env.NOTIFIER_PASSWORD) return res.status(503).json({ ok: false, error: "not_configured" });

  const base = `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents`;
  try {
    const token = await signIn(apiKey);
    const auth = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

    const got = await fetch(`${base}/orders/${orderId}`, { headers: auth });
    if (got.status === 404 || got.status === 403) return res.status(404).json({ ok: false });
    if (!got.ok) throw new Error(`read ${got.status}`);
    const fields = (await got.json()).fields ?? {};
    const order = Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, val(v)]));

    // احجزي «الإرسال» أولاً: الإنشاء يفشل (409/403) لو الإشعار اتبعت قبل كده
    const mark = await fetch(`${base}/orderNotifications?documentId=${orderId}`, { method: "POST", headers: auth, body: JSON.stringify({ fields: { orderId: { stringValue: orderId } } }) });
    if (mark.status === 409 || mark.status === 403) return res.status(200).json({ ok: true, duplicate: true });
    if (!mark.ok) throw new Error(`mark ${mark.status}`);

    const host = req.headers["x-forwarded-host"] || req.headers.host || "velora-store-navy.vercel.app";
    const tg = await fetch(`https://api.telegram.org/bot${bot}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text: formatMessage(order, orderId, host), parse_mode: "HTML", disable_web_page_preview: true }),
    });
    if (!tg.ok) {
      // فشل الإرسال: نحذف العلامة لتُعاد المحاولة لاحقاً
      await fetch(`${base}/orderNotifications/${orderId}`, { method: "DELETE", headers: auth }).catch(() => {});
      throw new Error(`telegram ${tg.status}`);
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[notify-order]", err?.message);
    return res.status(502).json({ ok: false });
  }
}
