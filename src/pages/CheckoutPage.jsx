// src/pages/CheckoutPage.jsx  →  المسار: /checkout
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Banknote, CreditCard, Loader2, Smartphone, Sparkles } from "lucide-react";
import PageShell from "../components/layout/PageShell";
import { formatPrice } from "../components/catalog/catalogConfig";
import { useCart } from "../context/CartContext";
import { createOrder } from "../services/orderService";
import { WALLET_NUMBER, WALLET_NAME } from "../config/store";

const GOVERNORATES = [
  "القاهرة", "الجيزة", "الإسكندرية", "القليوبية", "الشرقية", "الدقهلية", "البحيرة", "المنوفية", "الغربية",
  "كفر الشيخ", "دمياط", "بورسعيد", "الإسماعيلية", "السويس", "شمال سيناء", "جنوب سيناء", "الفيوم",
  "بني سويف", "المنيا", "أسيوط", "سوهاج", "قنا", "الأقصر", "أسوان", "البحر الأحمر", "الوادي الجديد", "مطروح",
];

const EMPTY_FORM = { name: "", phone: "", governorate: "", city: "", address: "", notes: "", walletSender: "" };

// يحوّل الأرقام العربية إلى إنجليزية ويقبل +20 أو 0020 أو مسافات
const normalizePhone = (raw) =>
  raw
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d))
    .replace(/[\s\-()]/g, "")
    .replace(/^(\+20|0020)/, "0");

const validate = (f, method = "cod") => {
  const e = {};
  if (method === "wallet" && !/^01[0125]\d{8}$/.test(normalizePhone(f.walletSender))) e.walletSender = "اكتب رقم المحفظة اللي هتحوّل منها (11 رقم)";
  if (f.name.trim().length < 3) e.name = "اكتب الاسم الكامل (3 أحرف على الأقل)";
  if (!/^01[0125]\d{8}$/.test(normalizePhone(f.phone))) e.phone = "اكتب رقم موبايل مصري صحيح، مثل 01012345678";
  if (!f.governorate) e.governorate = "اختر المحافظة";
  if (f.city.trim().length < 2) e.city = "اكتب المدينة أو المنطقة";
  if (f.address.trim().length < 8) e.address = "اكتب العنوان بالتفصيل (الشارع ورقم المبنى والشقة)";
  return e;
};

function Field({ id, label, error, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">{label}</label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-[#8C6F7B]">{hint}</p>
      ) : null}
    </div>
  );
}

const inputCls = (err) =>
  `h-11 w-full rounded-xl border bg-white px-3.5 text-sm outline-none focus:ring-2 ${
    err ? "border-red-400 focus:ring-red-200" : "border-[#F3D5DD] focus:border-[#C2557A] focus:ring-[#C2557A]/20"
  }`;

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, subtotal, shipping, total, clearCart } = useCart();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [method, setMethod] = useState("cod");
  const [copied, setCopied] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    document.title = "إتمام الشراء | velora";
  }, []);

  const setField = (key) => (e) => {
    const next = { ...form, [key]: e.target.value };
    setForm(next);
    if (submitted) setErrors(validate(next, method)); // بعد أول محاولة نصحّح الأخطاء لحظياً
  };
  const blurField = (key) => () => setErrors((prev) => ({ ...prev, [key]: validate(form, method)[key] }));

  const fieldProps = (key) => ({
    id: `f-${key}`,
    value: form[key],
    onChange: setField(key),
    onBlur: blurField(key),
    className: inputCls(errors[key]),
    "aria-invalid": errors[key] ? true : undefined,
    "aria-describedby": errors[key] ? `f-${key}-error` : undefined,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return; // يمنع الإرسال المزدوج
    setSubmitted(true);

    const errs = validate(form, method);
    setErrors(errs);
    const firstKey = Object.keys(errs)[0];
    if (firstKey) {
      document.getElementById(`f-${firstKey}`)?.focus();
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      const order = await createOrder({
        customer: {
          name: form.name.trim(),
          phone: normalizePhone(form.phone),
          governorate: form.governorate,
          city: form.city.trim(),
          address: form.address.trim(),
          notes: form.notes.trim(),
        },
        items: cart,
        paymentMethod: method,
        walletSender: method === "wallet" ? normalizePhone(form.walletSender) : "",
      });
      navigate(`/order/${order.id}`, { replace: true });
      clearCart();
    } catch (err) {
      console.error("[checkout]", err);
      setSubmitError(err?.userMessage || "تعذّر إتمام الطلب. تأكد من اتصالك وحاول مرة أخرى.");
      setSubmitting(false);
    }
  };

  if (cart.length === 0 && !submitting) {
    return (
      <PageShell maxWidth="max-w-3xl">
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <h1 className="text-2xl font-bold">سلتك فارغة</h1>
          <p className="text-[#8C6F7B]">أضف بعض المنتجات أولاً ثم ارجع لإتمام الشراء.</p>
          <Link to="/" className="flex h-12 items-center rounded-full bg-[#4A2C3A] px-8 text-sm font-bold text-white hover:bg-[#C2557A]">
            تصفّح المنتجات
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell maxWidth="max-w-6xl">
      <h1 className="mb-6 text-2xl font-bold">إتمام الشراء</h1>

      <form onSubmit={handleSubmit} noValidate className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          {/* بيانات التوصيل */}
          <section aria-labelledby="shipping-title" className="rounded-3xl border border-[#F3D5DD] bg-white p-5 md:p-6">
            <h2 id="shipping-title" className="mb-5 text-lg font-bold">بيانات التوصيل</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field id="f-name" label="الاسم الكامل" error={errors.name}>
                  <input type="text" autoComplete="name" {...fieldProps("name")} />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field id="f-phone" label="رقم الموبايل" error={errors.phone} hint="سيتصل بك مندوب التوصيل على هذا الرقم">
                  <input type="tel" inputMode="tel" dir="ltr" placeholder="01xxxxxxxxx" autoComplete="tel" {...fieldProps("phone")} className={`${inputCls(errors.phone)} text-end`} />
                </Field>
              </div>
              <Field id="f-governorate" label="المحافظة" error={errors.governorate}>
                <select autoComplete="address-level1" {...fieldProps("governorate")}>
                  <option value="">اختر المحافظة</option>
                  {GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </Field>
              <Field id="f-city" label="المدينة / المنطقة" error={errors.city}>
                <input type="text" autoComplete="address-level2" {...fieldProps("city")} />
              </Field>
              <div className="sm:col-span-2">
                <Field id="f-address" label="العنوان بالتفصيل" error={errors.address} hint="الشارع، رقم المبنى، الدور، رقم الشقة، وأقرب علامة مميزة">
                  <input type="text" autoComplete="street-address" {...fieldProps("address")} />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field id="f-notes" label="ملاحظات للطلب (اختياري)">
                  <textarea rows={3} {...fieldProps("notes")} className="w-full rounded-xl border border-[#F3D5DD] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#C2557A] focus:ring-2 focus:ring-[#C2557A]/20" />
                </Field>
              </div>
            </div>
          </section>

          {/* طريقة الدفع */}
          <fieldset className="rounded-3xl border border-[#F3D5DD] bg-white p-5 md:p-6">
            <legend className="px-2 text-lg font-bold">طريقة الدفع</legend>
            <div className="mt-2 space-y-3">
              <label className={`flex cursor-pointer items-center gap-3 rounded-2xl p-4 ${method === "cod" ? "border-2 border-[#C2557A] bg-[#FFF9FA]" : "border border-[#F3D5DD]"}`}>
                <input type="radio" name="payment" value="cod" checked={method === "cod"} onChange={() => setMethod("cod")} className="h-4 w-4 accent-[#C2557A]" />
                <Banknote className="h-5 w-5 text-[#C2557A]" aria-hidden="true" />
                <span className="flex-1">
                  <span className="block font-medium">الدفع عند الاستلام</span>
                  <span className="block text-xs text-[#8C6F7B]">ادفع نقداً للمندوب عند وصول طلبك</span>
                </span>
              </label>
              {WALLET_NUMBER && (
                <div className={`rounded-2xl p-4 ${method === "wallet" ? "border-2 border-[#C2557A] bg-[#FFF9FA]" : "border border-[#F3D5DD]"}`}>
                  <label className="flex cursor-pointer items-center gap-3">
                    <input type="radio" name="payment" value="wallet" checked={method === "wallet"} onChange={() => setMethod("wallet")} className="h-4 w-4 accent-[#C2557A]" />
                    <Smartphone className="h-5 w-5 text-[#C2557A]" aria-hidden="true" />
                    <span className="flex-1">
                      <span className="block font-medium">تحويل على محفظة {WALLET_NAME}</span>
                      <span className="block text-xs text-[#8C6F7B]">حوّل المبلغ وهنأكد طلبك بعد وصول التحويل</span>
                    </span>
                  </label>
                  {method === "wallet" && (
                    <div className="mt-4 space-y-4 border-t border-[#F3D5DD] pt-4 text-sm">
                      <ol className="list-decimal space-y-1 ps-5 text-[#4A2C3A]">
                        <li>حوّل <b>{formatPrice(total)}</b> على رقم المحفظة:</li>
                      </ol>
                      <div className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-[#F3D5DD]">
                        <span dir="ltr" className="text-lg font-bold tracking-wider">{WALLET_NUMBER}</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(WALLET_NUMBER).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(() => {});
                          }}
                          className="rounded-full bg-[#4A2C3A] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#C2557A]"
                        >
                          {copied ? "تم النسخ" : "نسخ الرقم"}
                        </button>
                      </div>
                      <Field id="f-walletSender" label="رقم المحفظة اللي حوّلت منها" error={errors.walletSender} hint="عشان نطابق التحويل مع طلبك">
                        <input type="tel" inputMode="tel" dir="ltr" placeholder="01xxxxxxxxx" {...fieldProps("walletSender")} className={`${inputCls(errors.walletSender)} text-end`} />
                      </Field>
                    </div>
                  )}
                </div>
              )}
              <label className="flex cursor-not-allowed items-center gap-3 rounded-2xl border border-[#F3D5DD] p-4 opacity-60">
                <input type="radio" name="payment" value="card" disabled className="h-4 w-4" />
                <CreditCard className="h-5 w-5" aria-hidden="true" />
                <span className="flex-1 font-medium">بطاقة بنكية</span>
                <span className="rounded-full bg-[#FBE4EA] px-2.5 py-0.5 text-xs">قريباً</span>
              </label>
            </div>
          </fieldset>
        </div>

        {/* ملخص الطلب */}
        <aside aria-labelledby="summary-title" className="h-fit rounded-3xl border border-[#F3D5DD] bg-white p-5 lg:sticky lg:top-24">
          <h2 id="summary-title" className="mb-4 text-lg font-bold">ملخص الطلب</h2>
          <ul className="max-h-72 space-y-3 overflow-y-auto">
            {cart.map((item) => (
              <li key={item.cartItemId} className="flex items-center gap-3">
                <div
                  className="relative flex h-14 w-12 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: `linear-gradient(160deg, #FFF1F4, ${item.shade?.hex ?? "#F7CFD9"})` }}
                >
                  <Sparkles className="h-4 w-4 text-white/80" aria-hidden="true" />
                  <span className="absolute -end-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#4A2C3A] px-1 text-xs font-bold text-white">{item.quantity}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-medium">{item.name}</p>
                  {item.shade && <p className="text-xs text-[#8C6F7B]">{item.shade.name}</p>}
                </div>
                <p className="text-sm font-medium">{formatPrice(item.price * item.quantity)}</p>
              </li>
            ))}
          </ul>

          <dl className="mt-5 space-y-2 border-t border-[#F3D5DD] pt-4 text-sm">
            <div className="flex justify-between text-[#8C6F7B]"><dt>المجموع الفرعي</dt><dd className="text-[#4A2C3A]">{formatPrice(subtotal)}</dd></div>
            <div className="flex justify-between text-[#8C6F7B]">
              <dt>الشحن</dt>
              <dd className={shipping === 0 ? "font-medium text-[#C2557A]" : "text-[#4A2C3A]"}>{shipping === 0 ? "مجاني" : formatPrice(shipping)}</dd>
            </div>
            <div className="flex justify-between border-t border-[#F3D5DD] pt-3 text-base font-bold"><dt>الإجمالي</dt><dd>{formatPrice(total)}</dd></div>
          </dl>

          {submitError && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{submitError}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#C2557A] text-sm font-bold text-white outline-none transition-colors hover:bg-[#A94467] focus-visible:ring-2 focus-visible:ring-[#C2557A] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? (<><Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />جارٍ تأكيد الطلب...</>) : `تأكيد الطلب · ${formatPrice(total)}`}
          </button>
          <p className="mt-3 text-center text-xs text-[#8C6F7B]">{method === "wallet" ? `حوّل ${formatPrice(total)} على المحفظة وهنأكد الطلب بعد وصول التحويل` : `بتأكيد الطلب ستدفع ${formatPrice(total)} نقداً عند الاستلام`}</p>
          <Link to="/" className="mt-3 block text-center text-sm text-[#8C6F7B] hover:text-[#C2557A]">متابعة التسوق</Link>
        </aside>
      </form>
    </PageShell>
  );
}
