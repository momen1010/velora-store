import { WHATSAPP_NUMBER } from "../config/store";

export const whatsappLink = (text) =>
  WHATSAPP_NUMBER ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}` : "";

// رسالة الطلب اللي العميل يبعتها لواتساب المتجر (جاهزة، يضغط إرسال بس)
export function buildOrderMessage(order, { walletNumber = "", walletName = "" } = {}) {
  const c = order.customer;
  const lines = [
    `طلب جديد من موقع Velora`,
    `رقم الطلب: ${order.id}`,
    "",
    "المنتجات:",
    ...order.items.map(
      (i) => `- ${i.name}${i.shade ? ` (${i.shade.name})` : ""} × ${i.quantity} = ${i.price * i.quantity} ج.م`
    ),
    "",
    `المجموع: ${order.subtotal} ج.م`,
    `الشحن: ${order.shipping === 0 ? "مجاني" : `${order.shipping} ج.م`}`,
    `الإجمالي: ${order.total} ج.م`,
    "",
    order.paymentMethod === "wallet"
      ? `الدفع: تحويل على ${walletName} ${walletNumber} (من رقم ${order.walletSender})`
      : "الدفع: عند الاستلام",
    "",
    `الاسم: ${c.name}`,
    `الموبايل: ${c.phone}`,
    `العنوان: ${c.address}، ${c.city}، ${c.governorate}`,
  ];
  if (c.notes) lines.push(`ملاحظات: ${c.notes}`);
  return lines.join("\n");
}
