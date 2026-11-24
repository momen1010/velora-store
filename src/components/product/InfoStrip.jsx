// معلومات التوصيل والدفع والاسترجاع داخل صفحة المنتج.
import { Truck, RotateCcw, Banknote, PhoneCall } from "lucide-react";
import { formatPrice } from "../catalog/catalogConfig";
import { DELIVERY_DAYS, RETURN_LABEL } from "../../config/store";
import { Link } from "react-router-dom";

export default function InfoStrip({ shippingFee, freeThreshold }) {
  const items = [
    { Icon: Truck, title: "توصيل لكل المحافظات", text: `خلال ${DELIVERY_DAYS}. الشحن ${formatPrice(shippingFee)}، ومجاني فوق ${formatPrice(freeThreshold)}.` },
    { Icon: Banknote, title: "الدفع عند الاستلام", text: "ادفعي كاش لمندوب الشحن بعد ما تستلمي طلبك." },
    { Icon: RotateCcw, title: `استرجاع واستبدال خلال ${RETURN_LABEL}`, text: "حسب سياسة الاسترجاع للمنتج الأصلي غير المستخدم." },
    { Icon: PhoneCall, title: "تأكيد الطلب بالتليفون", text: "بنتواصل معاكي على واتساب أو بالاتصال لتأكيد الطلب والعنوان." },
  ];
  return (
    <div className="mt-6 grid gap-3 rounded-2xl border border-[#F3DDE3] bg-white p-4 sm:grid-cols-2">
      {items.map(({ Icon, title, text }) => (
        <div key={title} className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FCE7EC] text-[#C2557A]"><Icon className="h-5 w-5" /></span>
          <div>
            <p className="text-sm font-semibold text-[#4A2C3A]">{title}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{text}</p>
          </div>
        </div>
      ))}
      <Link to="/shipping-returns" className="text-xs font-semibold text-[#C2557A] hover:underline sm:col-span-2">تفاصيل الشحن والاسترجاع ←</Link>
    </div>
  );
}
