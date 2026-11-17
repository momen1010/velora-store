// src/pages/OrderConfirmationPage.jsx  →  المسار: /order/:orderId
import { useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { Banknote, CheckCircle2, MapPin, Sparkles } from "lucide-react";
import PageShell from "../components/layout/PageShell";
import { formatPrice } from "../components/catalog/catalogConfig";
import { getOrderById } from "../services/orderService";

export default function OrderConfirmationPage() {
  const { orderId } = useParams();
  const order = useMemo(() => getOrderById(orderId), [orderId]);

  useEffect(() => {
    document.title = "تم استلام طلبك | velora";
  }, []);

  if (!order) {
    return (
      <PageShell maxWidth="max-w-3xl">
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <h1 className="text-2xl font-bold">لم نعثر على الطلب</h1>
          <p className="text-[#8C6F7B]">تأكد من رقم الطلب أو افتح الرابط من نفس الجهاز الذي أتممت منه الشراء.</p>
          <Link to="/" className="flex h-12 items-center rounded-full bg-[#4A2C3A] px-8 text-sm font-bold text-white hover:bg-[#C2557A]">العودة للمنتجات</Link>
        </div>
      </PageShell>
    );
  }

  const { customer } = order;
  const date = new Date(order.createdAt).toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" });

  return (
    <PageShell maxWidth="max-w-3xl">
      <div className="flex flex-col items-center text-center">
        <CheckCircle2 className="h-16 w-16 text-[#C2557A]" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-bold">تم استلام طلبك، شكراً لك</h1>
        <p className="mt-2 text-sm leading-7 text-[#8C6F7B]">
          سنتواصل معك على <span dir="ltr" className="font-medium text-[#4A2C3A]">{customer.phone}</span> لتأكيد الطلب،
          <br />والتوصيل المتوقع خلال 2 إلى 4 أيام عمل.
        </p>
        <div className="mt-5 rounded-2xl bg-[#FBE4EA] px-6 py-3">
          <p className="text-xs text-[#8C6F7B]">رقم الطلب</p>
          <p dir="ltr" className="text-lg font-bold tracking-wide">{order.id}</p>
        </div>
        <p className="mt-2 text-xs text-[#8C6F7B]">بتاريخ {date}</p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <section className="rounded-3xl border border-[#F3D5DD] bg-white p-5">
          <h2 className="mb-3 flex items-center gap-2 font-bold"><MapPin className="h-4 w-4 text-[#C2557A]" aria-hidden="true" />عنوان التوصيل</h2>
          <p className="text-sm font-medium">{customer.name}</p>
          <p className="mt-1 text-sm leading-6 text-[#8C6F7B]">{customer.address}، {customer.city}، {customer.governorate}</p>
          {customer.notes && <p className="mt-2 text-xs text-[#8C6F7B]">ملاحظات: {customer.notes}</p>}
        </section>
        <section className="rounded-3xl border border-[#F3D5DD] bg-white p-5">
          <h2 className="mb-3 flex items-center gap-2 font-bold"><Banknote className="h-4 w-4 text-[#C2557A]" aria-hidden="true" />الدفع</h2>
          <p className="text-sm font-medium">الدفع عند الاستلام</p>
          <p className="mt-1 text-sm text-[#8C6F7B]">جهّز مبلغ <b className="text-[#4A2C3A]">{formatPrice(order.total)}</b> للمندوب</p>
        </section>
      </div>

      <section aria-labelledby="items-title" className="mt-4 rounded-3xl border border-[#F3D5DD] bg-white p-5">
        <h2 id="items-title" className="mb-4 font-bold">تفاصيل الطلب</h2>
        <ul className="space-y-3">
          {order.items.map((item) => (
            <li key={item.cartItemId} className="flex items-center gap-3">
              <div className="flex h-14 w-12 shrink-0 items-center justify-center rounded-lg" style={{ background: `linear-gradient(160deg, #FFF1F4, ${item.shade?.hex ?? "#F7CFD9"})` }}>
                <Sparkles className="h-4 w-4 text-white/80" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-medium">{item.name}</p>
                <p className="text-xs text-[#8C6F7B]">{item.shade ? `${item.shade.name} · ` : ""}الكمية: {item.quantity}</p>
              </div>
              <p className="text-sm font-medium">{formatPrice(item.price * item.quantity)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-5 space-y-2 border-t border-[#F3D5DD] pt-4 text-sm">
          <div className="flex justify-between text-[#8C6F7B]"><dt>المجموع الفرعي</dt><dd className="text-[#4A2C3A]">{formatPrice(order.subtotal)}</dd></div>
          <div className="flex justify-between text-[#8C6F7B]"><dt>الشحن</dt><dd className={order.shipping === 0 ? "font-medium text-[#C2557A]" : "text-[#4A2C3A]"}>{order.shipping === 0 ? "مجاني" : formatPrice(order.shipping)}</dd></div>
          <div className="flex justify-between border-t border-[#F3D5DD] pt-3 text-base font-bold"><dt>الإجمالي</dt><dd>{formatPrice(order.total)}</dd></div>
        </dl>
      </section>

      <div className="mt-8 text-center">
        <Link to="/" className="inline-flex h-12 items-center rounded-full bg-[#4A2C3A] px-10 text-sm font-bold text-white hover:bg-[#C2557A]">متابعة التسوق</Link>
      </div>
    </PageShell>
  );
}
