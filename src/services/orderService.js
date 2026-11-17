// src/services/orderService.js
// طبقة الطلبات. حالياً تحفظ في localStorage (بدون Backend).
// عند ربط الـ API استبدل داخل الدالتين فقط (createOrder / getOrderById) ولا تغيّر الصفحات.
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "../context/CartContext";

const ORDERS_KEY = "velora_orders_v1";
const MAX_STORED = 50;

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

const generateOrderId = () =>
  `GLW-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 4).toUpperCase()}`;

/**
 * ينشئ الطلب ويحسب الإجماليات من العناصر نفسها (لا يثق بأرقام قادمة من الواجهة).
 * @param {{ customer: object, items: object[], paymentMethod?: string }} payload
 */
export async function createOrder({ customer, items, paymentMethod = "cod" }) {
  if (!Array.isArray(items) || items.length === 0) throw new Error("السلة فارغة");
  if (!customer) throw new Error("بيانات العميل ناقصة");

  await new Promise((r) => setTimeout(r, 500)); // محاكاة زمن الشبكة

  const orderItems = items.map((i) => ({
    cartItemId: i.cartItemId,
    id: i.id,
    name: i.name,
    brand: i.brand,
    image: i.image,
    price: i.price,
    shade: i.shade ?? null,
    quantity: i.quantity,
  }));
  const subtotal = round2(orderItems.reduce((s, i) => s + i.price * i.quantity, 0));
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;

  const order = {
    id: generateOrderId(),
    createdAt: new Date().toISOString(),
    status: "pending",
    paymentMethod,
    customer,
    items: orderItems,
    subtotal,
    shipping,
    total: round2(subtotal + shipping),
  };

  try {
    window.localStorage.setItem(ORDERS_KEY, JSON.stringify([order, ...readOrders()].slice(0, MAX_STORED)));
  } catch (err) {
    console.error("[orders] تعذّر حفظ الطلب:", err);
    throw new Error("تعذّر حفظ الطلب");
  }
  return order;
}

export function getOrderById(orderId) {
  return readOrders().find((o) => o.id === orderId) ?? null;
}