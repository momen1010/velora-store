import { WHATSAPP_NUMBER } from "../config/store";

export const whatsappLink = (text) =>
  WHATSAPP_NUMBER ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}` : "";

const KEYCAPS = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
const egp = (n) => `${Number(n).toLocaleString("en-US")} ج.م`;
const sizeOf = (item) => (typeof item.cartItemId === "string" ? item.cartItemId.split("__")[2] : "") || "";
const LINE = "━━━━━━━━━━━━━━";

// رسالة الطلب اللي العميل يبعتها لواتساب المتجر (جاهزة، يضغط إرسال بس)
export function buildOrderMessage(order, { walletNumber = "", walletName = "" } = {}) {
  const c = order.customer;
  const lines = ["🛍️ *طلب جديد من متجر Velora*", LINE];
  if (order.id) lines.push(`🧾 *رقم الطلب:* ${order.id}`);
  lines.push(`📅 *التاريخ:* ${new Date().toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" })}`, "");

  lines.push("*🛒 المنتجات*");
  order.items.forEach((i, idx) => {
    const opts = [i.shade?.name, sizeOf(i) && `مقاس ${sizeOf(i)}`].filter(Boolean).join(" - ");
    lines.push(`${KEYCAPS[idx] ?? `${idx + 1}.`} *${i.name}*${opts ? ` (${opts})` : ""}`);
    lines.push(`     الكمية: ${i.quantity} × ${egp(i.price)} = *${egp(i.price * i.quantity)}*`);
  });
  lines.push("", LINE, "*💰 ملخص الحساب*");
  lines.push(`المجموع: ${egp(order.subtotal)}`);
  if (order.discount > 0) lines.push(`الخصم: - ${egp(order.discount)}`);
  lines.push(`الشحن: ${order.shipping === 0 ? "مجاني 🎉" : egp(order.shipping)}`);
  lines.push(`*الإجمالي: ${egp(order.total)}*`);
  lines.push(
    order.paymentMethod === "wallet"
      ? `💳 *الدفع:* تحويل على ${walletName} ${walletNumber} (من رقم ${order.walletSender})`
      : order.paymentMethod === "chat"
        ? "💳 *الدفع:* نتفق عليه هنا (عند الاستلام أو تحويل)"
        : "💳 *الدفع:* عند الاستلام"
  );
  lines.push("", LINE, "*📦 بيانات التوصيل*");
  lines.push(`👤 *الاسم:* ${c.name}`, `📱 *الموبايل:* ${c.phone}`, `📍 *المحافظة:* ${c.governorate}`, `🏙️ *المدينة / المنطقة:* ${c.city}`, `🏠 *العنوان:* ${c.address}`);
  if (c.notes) lines.push(`📝 *ملاحظات:* ${c.notes}`);
  lines.push("", LINE, "_شكراً لاختياركم Velora 🌸_");
  return lines.join("\n");
}
