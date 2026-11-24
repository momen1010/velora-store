// src/services/orderService.js
// الطلبات تُحفظ في Firestore (مجموعة "orders"). العميل يقدر ينشئ طلباً فقط؛
// لا يقدر يقرأ أو يعدّل أو يحذف أي طلب (انظر firestore.rules).
// نسخة محلية من الطلب تُحفظ على جهاز العميل لصفحة التأكيد فقط.
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../firebase/config";
import { MAX_ITEM_QTY, computeDiscount } from "../context/CartContext";
import { sanitizeText } from "../utils/sanitize";

const ORDERS_KEY = "velora_orders_v1";
const MAX_STORED = 50;
export const MAX_CART_LINES = 4; // لازم يطابق firestore.rules (حد 1000 تعبير في القواعد)
const SAVE_TIMEOUT_MS = 20000;

const round2 = (n) => Math.round(n * 100) / 100;

const readOrders = () => {
  try {
    const raw = window.localStorage.getItem(ORDERS_KEY);
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

// رقم طلب غير قابل للتخمين (عشوائي تشفيرياً) لأن النسخة الوحيدة المتاحة للعميل محلية
const generateOrderId = () => {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const rand = Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("").toUpperCase().slice(0, 10);
  return `GLW-${rand}`;
};

const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);

/**
 * ينشئ الطلب ويحسب الإجماليات من العناصر نفسها ثم يحفظه في Firestore.
 * @param {{ customer: object, items: object[], paymentMethod?: string }} payload
 */
export async function createOrder({ customer, items, paymentMethod = "cod", walletSender = "", settings, promo = null }) {
  if (!Array.isArray(items) || items.length === 0) throw new Error("السلة فارغة");
  if (items.length > MAX_CART_LINES) {
    throw Object.assign(new Error("too many lines"), {
      userMessage: `الحد الأقصى ${MAX_CART_LINES} أصناف مختلفة في الطلب الواحد. أنهِ هذا الطلب ثم اطلب الباقي في طلب ثانٍ.`,
    });
  }
  if (!customer) throw new Error("بيانات العميل ناقصة");
  if (paymentMethod !== "cod" && paymentMethod !== "wallet") throw new Error("طريقة دفع غير مدعومة");
  if (paymentMethod === "wallet" && !/^01[0125]\d{8}$/.test(String(walletSender))) {
    throw Object.assign(new Error("invalid wallet sender"), { userMessage: "اكتب رقم المحفظة اللي حوّلت منها (11 رقم)." });
  }
  if (!isFirebaseConfigured || !db) throw new Error("Firebase غير مُعدّ");

  const orderItems = items.map((i) => ({
    cartItemId: String(i.cartItemId).slice(0, 100),
    id: typeof i.id === "number" ? i.id : String(i.id).slice(0, 50),
    name: sanitizeText(i.name),
    brand: sanitizeText(i.brand ?? ""),
    image: typeof i.image === "string" ? i.image.slice(0, 300) : "",
    price: Number(i.price),
    shade: i.shade ? { name: sanitizeText(i.shade.name), hex: String(i.shade.hex) } : null,
    quantity: Math.min(Math.max(Math.trunc(Number(i.quantity)), 1), MAX_ITEM_QTY),
  }));
  if (orderItems.some((i) => !Number.isFinite(i.price) || i.price < 0)) throw new Error("سعر غير صالح");

  const subtotal = round2(orderItems.reduce((s, i) => s + i.price * i.quantity, 0));
  const threshold = Number(settings?.freeShippingThreshold);
  const fee = Number(settings?.shippingFee);
  if (!Number.isFinite(threshold) || !Number.isFinite(fee)) throw new Error("إعدادات الشحن غير متاحة");
  const shipping = subtotal >= threshold ? 0 : fee;
  const discount = computeDiscount(promo, subtotal);

  const safeCustomer = {
    name: sanitizeText(customer.name),
    phone: String(customer.phone),
    governorate: String(customer.governorate),
    city: sanitizeText(customer.city),
    address: sanitizeText(customer.address),
    notes: sanitizeText(customer.notes ?? ""),
  };

  const id = generateOrderId();
  const base = {
    paymentMethod,
    status: "pending",
    customer: safeCustomer,
    items: orderItems,
    subtotal,
    shipping,
    total: round2(subtotal - discount + shipping),
    ...(discount > 0 ? { discount, promoCode: promo.code } : {}),
    ...(paymentMethod === "wallet" ? { walletSender: String(walletSender) } : {}),
  };

  try {
    await withTimeout(setDoc(doc(db, "orders", id), { ...base, createdAt: serverTimestamp() }), SAVE_TIMEOUT_MS);
  } catch (err) {
    console.error("[orders] تعذّر حفظ الطلب:", err?.code ?? err?.message);
    throw new Error("تعذّر حفظ الطلب", { cause: err });
  }

  const order = { id, createdAt: new Date().toISOString(), ...base };

  // نسخة محلية لصفحة التأكيد فقط؛ فشلها لا يعني فشل الطلب
  try {
    window.localStorage.setItem(ORDERS_KEY, JSON.stringify([order, ...readOrders()].slice(0, MAX_STORED)));
  } catch (err) {
    console.warn("[orders] تعذّر حفظ النسخة المحلية:", err);
  }
  return order;
}

// صفحة التأكيد تقرأ النسخة المحلية فقط (العميل لا يملك صلاحية قراءة Firestore)
export function getOrderById(orderId) {
  return readOrders().find((o) => o.id === orderId) ?? null;
}
