// src/pages/CheckoutPage.jsx  →  المسار: /checkout
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Banknote, Check, CreditCard, Globe, Loader2, MapPin, MessageCircle, Smartphone, Sparkles, Wallet } from "lucide-react";
import PageShell from "../components/layout/PageShell";
import { formatPrice } from "../components/catalog/catalogConfig";
import { useCart } from "../context/CartContext";
import { createOrder } from "../services/orderService";
import { useCatalog } from "../context/CatalogContext";
import PromoBox from "../components/cart/PromoBox";
import { WALLET_NUMBER, WALLET_NAME, WHATSAPP_NUMBER } from "../config/store";
import { buildOrderMessage, whatsappLink } from "../utils/whatsapp";

const GOVERNORATES = [
  "القاهرة", "الجيزة", "الإسكندرية", "القليوبية", "الشرقية", "الدقهلية", "البحيرة", "المنوفية", "الغربية",
  "كفر الشيخ", "دمياط", "بورسعيد", "الإسماعيلية", "السويس", "شمال سيناء", "جنوب سيناء", "الفيوم",
  "بني سويف", "المنيا", "أسيوط", "سوهاج", "قنا", "الأقصر", "أسوان", "البحر الأحمر", "الوادي الجديد", "مطروح",
];

const EMPTY_FORM = { name: "", phone: "", governorate: "", city: "", address: "", notes: "", walletSender: "" };

// خطوات إتمام الشراء: البيانات ثم الدفع ثم التأكيد. مسار واتساب يختصر الدفع لأنه يتم في المحادثة.
const SITE_STEPS = [
  { id: "details", label: "البيانات" },
  { id: "payment", label: "الدفع" },
  { id: "confirm", label: "التأكيد" },
];
const WA_STEPS = [
  { id: "details", label: "البيانات" },
  { id: "confirm", label: "التأكيد" },
];
const AR_NUMERALS = ["١", "٢", "٣"];
const DETAIL_KEYS = ["name", "phone", "governorate", "city", "address"];

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

const pickErrors = (errs, keys) => keys.reduce((acc, k) => (errs[k] ? { ...acc, [k]: errs[k] } : acc), {});

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

// مؤشر الخطوات: دائرة مرقّمة بالأرقام العربية مع خط واصل، والخطوات المنجزة قابلة للرجوع بالضغط
function StepIndicator({ steps, currentIndex, onJump }) {
  return (
    <nav aria-label="خطوات إتمام الشراء" className="mb-6">
      <ol className="flex items-start">
        {steps.map((s, i) => {
          const done = i < currentIndex;
          const current = i === currentIndex;
          const circle = (
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                done
                  ? "bg-[#C2557A] text-white"
                  : current
                    ? "bg-[#4A2C3A] text-white ring-4 ring-[#C2557A]/15"
                    : "border-2 border-[#F3D5DD] bg-white text-[#8C6F7B]"
              }`}
            >
              {done ? <Check className="h-4 w-4" aria-hidden="true" /> : AR_NUMERALS[i]}
            </span>
          );
          return (
            <li key={s.id} className={`flex flex-col items-center gap-1.5 ${i < steps.length - 1 ? "flex-1" : ""}`}>
              <div className="flex w-full items-center">
                {i > 0 && <span aria-hidden="true" className={`h-0.5 flex-1 rounded ${done || current ? "bg-[#C2557A]" : "bg-[#F3D5DD]"}`} />}
                {done ? (
                  <button
                    type="button"
                    onClick={() => onJump(i)}
                    aria-label={`الرجوع إلى خطوة ${s.label}`}
                    className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#C2557A] focus-visible:ring-offset-2"
                  >
                    {circle}
                  </button>
                ) : (
                  <span aria-current={current ? "step" : undefined}>{circle}</span>
                )}
                {i < steps.length - 1 && <span aria-hidden="true" className={`h-0.5 flex-1 rounded ${done ? "bg-[#C2557A]" : "bg-[#F3D5DD]"}`} />}
              </div>
              <span className={`text-xs ${current ? "font-bold text-[#4A2C3A]" : done ? "font-medium text-[#C2557A]" : "text-[#8C6F7B]"}`}>
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// أزرار التنقل أسفل كل خطوة (مهمة على الموبايل لأن ملخص الطلب يكون أسفل الصفحة)
function StepNav({ backLabel, onBack, nextLabel, onNext }) {
  return (
    <div className="mt-6 flex items-center gap-3">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex h-12 items-center gap-2 rounded-full border border-[#F3D5DD] bg-white px-5 text-sm font-bold text-[#4A2C3A] outline-none transition-colors hover:border-[#C2557A] focus-visible:ring-2 focus-visible:ring-[#C2557A]"
        >
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
          {backLabel}
        </button>
      )}
      <button
        type="button"
        onClick={onNext}
        className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#C2557A] px-5 text-sm font-bold text-white outline-none transition-colors hover:bg-[#A94467] focus-visible:ring-2 focus-visible:ring-[#C2557A] focus-visible:ring-offset-2"
      >
        {nextLabel}
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, subtotal, shipping, total, discount, promo, clearCart } = useCart();
  const { settings } = useCatalog();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [method, setMethod] = useState("cod");
  const [copied, setCopied] = useState(false);
  // طريقة إرسال الطلب: "site" (على الموقع) أو "whatsapp" (رسالة جاهزة لواتساب المتجر)
  const [mode, setMode] = useState("site");
  const [waLink, setWaLink] = useState("");
  const isWa = mode === "whatsapp" && Boolean(WHATSAPP_NUMBER);
  const [submitError, setSubmitError] = useState("");
  const [stepId, setStepId] = useState("details");

  const steps = isWa ? WA_STEPS : SITE_STEPS;
  const stepIndex = Math.max(0, steps.findIndex((s) => s.id === stepId));

  useEffect(() => {
    document.title = "إتمام الشراء | velora";
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [stepId]);

  const setField = (key) => (e) => {
    const next = { ...form, [key]: e.target.value };
    setForm(next);
    if (attempted) setErrors(validate(next, method)); // بعد أول محاولة نصحّح الأخطاء لحظياً
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

  const focusError = (errs) => {
    const firstKey = Object.keys(errs)[0];
    if (firstKey) document.getElementById(`f-${firstKey}`)?.focus();
    return firstKey;
  };

  const goNext = () => {
    setSubmitError("");
    if (stepId === "details") {
      const detailErrs = pickErrors(validate(form, "cod"), DETAIL_KEYS);
      setAttempted(true);
      setErrors((prev) => ({ ...prev, ...detailErrs }));
      if (focusError(detailErrs)) return;
      setErrors({});
      setStepId(isWa ? "confirm" : "payment");
      return;
    }
    if (stepId === "payment") {
      const walletErrs = method === "wallet" ? pickErrors(validate(form, "wallet"), ["walletSender"]) : {};
      setAttempted(true);
      setErrors((prev) => ({ ...prev, ...walletErrs }));
      if (focusError(walletErrs)) return;
      setErrors({});
      setStepId("confirm");
    }
  };

  const goBack = () => {
    setSubmitError("");
    if (stepId === "confirm") setStepId(isWa ? "details" : "payment");
    else if (stepId === "payment") setStepId("details");
  };

  const jumpTo = (i) => setStepId(steps[i].id);

  const nextLabel = stepId === "details" ? (isWa ? "متابعة إلى التأكيد" : "متابعة إلى الدفع") : "متابعة إلى التأكيد";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return; // يمنع الإرسال المزدوج
    // أي إرسال قبل خطوة التأكيد (مثل زرار الإدخال في حقل نصي) يتصرف كزر "التالي"
    if (stepId !== "confirm") {
      goNext();
      return;
    }
    setAttempted(true);

    // تحقق أخير شامل: أخطاء البيانات ترجع لخطوتها، وخطأ المحفظة يرجع لخطوة الدفع
    const errs = validate(form, isWa ? "cod" : method);
    setErrors(errs);
    const detailErrs = pickErrors(errs, DETAIL_KEYS);
    if (Object.keys(detailErrs).length) {
      setStepId("details");
      setTimeout(() => focusError(detailErrs), 0);
      return;
    }
    if (errs.walletSender) {
      setStepId("payment");
      setTimeout(() => focusError({ walletSender: errs.walletSender }), 0);
      return;
    }

    if (isWa) {
      // مسار واتساب: نجهّز الرسالة من بيانات الفورم والسلة ونفتح واتساب. لا نحفظ طلب في قاعدة البيانات.
      const link = whatsappLink(
        buildOrderMessage({
          paymentMethod: "chat",
          customer: {
            name: form.name.trim(),
            phone: normalizePhone(form.phone),
            governorate: form.governorate,
            city: form.city.trim(),
            address: form.address.trim(),
            notes: form.notes.trim(),
          },
          items: cart,
          subtotal,
          shipping,
          discount,
          total,
        })
      );
      setWaLink(link);
      window.open(link, "_blank", "noopener,noreferrer");
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
        settings,
        promo,
        paymentMethod: method,
        walletSender: method === "wallet" ? normalizePhone(form.walletSender) : "",
      });
      // إشعار تليجرام لصاحب المتجر (محاولة واحدة في الخلفية؛ فشلها لا يؤثر على الطلب)
      try {
        fetch("/api/notify-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: order.id }),
          keepalive: true,
        }).catch(() => {});
      } catch { /* ignore */ }
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
      <h1 className="mb-5 text-2xl font-bold">إتمام الشراء</h1>
      <StepIndicator steps={steps} currentIndex={stepIndex} onJump={jumpTo} />

      <form onSubmit={handleSubmit} noValidate className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          {stepId === "details" && (
            <>
              {/* طريقة إرسال الطلب */}
              {WHATSAPP_NUMBER && (
                <section aria-labelledby="mode-title" className="rounded-3xl border border-[#F3D5DD] bg-white p-5 md:p-6">
                  <h2 id="mode-title" className="mb-1 text-lg font-bold">كيف تحب تكمّل طلبك؟</h2>
                  <p className="mb-4 text-sm text-[#8C6F7B]">اختار الأنسب لك، وفي الحالتين بياناتك نفسها.</p>
                  <div role="radiogroup" aria-labelledby="mode-title" className="grid gap-3 sm:grid-cols-2">
                    {[
                      { id: "site", icon: Globe, title: "أكمل الطلب على الموقع", desc: "تأكيد فوري ورقم طلب، مع الدفع عند الاستلام أو تحويل.", tone: "#C2557A" },
                      { id: "whatsapp", icon: MessageCircle, title: "أرسل الطلب عبر واتساب", desc: "رسالة جاهزة بكل تفاصيل طلبك، وهنرد عليك ونأكد معاك.", tone: "#1FAF5A" },
                    ].map(({ id, icon: Icon, title, desc, tone }) => {
                      const active = mode === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => { setMode(id); setWaLink(""); setSubmitError(""); }}
                          className="relative flex items-start gap-3 rounded-2xl border-2 p-4 text-start outline-none transition focus-visible:ring-2 focus-visible:ring-offset-2"
                          style={{ borderColor: active ? tone : "#F3D5DD", background: active ? `${tone}12` : "#fff", "--tw-ring-color": tone }}
                        >
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white" style={{ background: tone }}>
                            <Icon className="h-5 w-5" aria-hidden="true" />
                          </span>
                          <span className="flex-1">
                            <span className="block font-bold">{title}</span>
                            <span className="mt-0.5 block text-xs leading-5 text-[#8C6F7B]">{desc}</span>
                          </span>
                          <span
                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2"
                            style={{ borderColor: active ? tone : "#E5C9D1", background: active ? tone : "transparent" }}
                            aria-hidden="true"
                          >
                            {active && <Check className="h-3 w-3 text-white" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

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
                <StepNav nextLabel={nextLabel} onNext={goNext} />
              </section>
            </>
          )}

          {/* طريقة الدفع */}
          {stepId === "payment" && !isWa && (
            <fieldset className="rounded-3xl border border-[#F3D5DD] bg-white p-5 md:p-6">
              <legend className="px-2 text-lg font-bold">طريقة الدفع</legend>
              <p className="mt-1 text-sm text-[#8C6F7B]">اختار طريقة الدفع المناسبة لك قبل تأكيد الطلب.</p>
              <div className="mt-4 space-y-3">
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
              <StepNav backLabel="رجوع للبيانات" onBack={goBack} nextLabel={nextLabel} onNext={goNext} />
            </fieldset>
          )}

          {/* مراجعة الطلب قبل التأكيد */}
          {stepId === "confirm" && (
            <section aria-labelledby="review-title" className="space-y-5">
              <h2 id="review-title" className="sr-only">مراجعة الطلب</h2>

              <div className="rounded-3xl border border-[#F3D5DD] bg-white p-5 md:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="flex items-center gap-2 font-bold">
                    <MapPin className="h-5 w-5 text-[#C2557A]" aria-hidden="true" />
                    بيانات التوصيل
                  </h3>
                  <button type="button" onClick={() => setStepId("details")} className="text-sm font-medium text-[#C2557A] underline underline-offset-4 hover:text-[#A94467]">
                    تعديل
                  </button>
                </div>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4"><dt className="text-[#8C6F7B]">الاسم</dt><dd className="font-medium">{form.name}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-[#8C6F7B]">الموبايل</dt><dd dir="ltr" className="font-medium">{normalizePhone(form.phone)}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-[#8C6F7B]">العنوان</dt><dd className="text-end font-medium">{form.address}، {form.city}، {form.governorate}</dd></div>
                  {form.notes.trim() && <div className="flex justify-between gap-4"><dt className="text-[#8C6F7B]">ملاحظات</dt><dd className="text-end font-medium">{form.notes}</dd></div>}
                </dl>
              </div>

              <div className="rounded-3xl border border-[#F3D5DD] bg-white p-5 md:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="flex items-center gap-2 font-bold">
                    <Wallet className="h-5 w-5 text-[#C2557A]" aria-hidden="true" />
                    طريقة الدفع
                  </h3>
                  {!isWa && (
                    <button type="button" onClick={() => setStepId("payment")} className="text-sm font-medium text-[#C2557A] underline underline-offset-4 hover:text-[#A94467]">
                      تعديل
                    </button>
                  )}
                </div>
                {isWa ? (
                  <p className="text-sm leading-6 text-[#8C6F7B]">هنكمل تفاصيل الدفع والتوصيل معاك على واتساب بعد إرسال الطلب.</p>
                ) : method === "wallet" ? (
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between gap-4"><span className="text-[#8C6F7B]">الطريقة</span><span className="font-medium">تحويل على محفظة {WALLET_NAME}</span></div>
                    <div className="flex justify-between gap-4"><span className="text-[#8C6F7B]">حوّلت من رقم</span><span dir="ltr" className="font-medium">{normalizePhone(form.walletSender)}</span></div>
                    <div className="flex items-center justify-between gap-3 rounded-xl bg-[#FFF9FA] px-4 py-3 ring-1 ring-[#F3D5DD]">
                      <span className="text-[#8C6F7B]">حوّل {formatPrice(total)} على</span>
                      <span dir="ltr" className="font-bold tracking-wider">{WALLET_NUMBER}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between gap-4 text-sm">
                    <span className="text-[#8C6F7B]">الطريقة</span>
                    <span className="font-medium">الدفع عند الاستلام — {formatPrice(total)} نقداً للمندوب</span>
                  </div>
                )}
              </div>

              <div className="flex items-center">
                <button
                  type="button"
                  onClick={goBack}
                  className="flex h-12 items-center gap-2 rounded-full border border-[#F3D5DD] bg-white px-5 text-sm font-bold text-[#4A2C3A] outline-none transition-colors hover:border-[#C2557A] focus-visible:ring-2 focus-visible:ring-[#C2557A]"
                >
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  {isWa ? "رجوع للبيانات" : "رجوع للدفع"}
                </button>
              </div>
            </section>
          )}
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
            {discount > 0 && <div className="flex justify-between text-[#8C6F7B]"><dt>الخصم</dt><dd className="font-medium text-[#C2557A]">- {formatPrice(discount)}</dd></div>}
            <div className="flex justify-between text-[#8C6F7B]">
              <dt>الشحن</dt>
              <dd className={shipping === 0 ? "font-medium text-[#C2557A]" : "text-[#4A2C3A]"}>{shipping === 0 ? "مجاني" : formatPrice(shipping)}</dd>
            </div>
            <div className="flex justify-between border-t border-[#F3D5DD] pt-3 text-base font-bold"><dt>الإجمالي</dt><dd>{formatPrice(total)}</dd></div>
          </dl>
          <PromoBox />

          {submitError && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{submitError}</p>}

          {stepId === "confirm" ? (
            <>
              <button
                type="submit"
                disabled={submitting}
                className={`mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-bold text-white outline-none transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 ${
                  isWa ? "bg-[#1FAF5A] hover:bg-[#188A47] focus-visible:ring-[#1FAF5A]" : "bg-[#C2557A] hover:bg-[#A94467] focus-visible:ring-[#C2557A]"
                }`}
              >
                {isWa ? (
                  <><MessageCircle className="h-5 w-5" aria-hidden="true" />أرسل الطلب عبر واتساب · {formatPrice(total)}</>
                ) : submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />جارٍ تأكيد الطلب...</>
                ) : (
                  `تأكيد الطلب · ${formatPrice(total)}`
                )}
              </button>
              <p className="mt-3 text-center text-xs text-[#8C6F7B]">
                {isWa
                  ? "هنفتحلك واتساب برسالة جاهزة بتفاصيل طلبك، اضغط إرسال وهنرد عليك ونأكد معاك الدفع والتوصيل."
                  : method === "wallet"
                    ? `حوّل ${formatPrice(total)} على المحفظة وهنأكد الطلب بعد وصول التحويل`
                    : `بتأكيد الطلب ستدفع ${formatPrice(total)} نقداً عند الاستلام`}
              </p>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={goNext}
                className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#C2557A] text-sm font-bold text-white outline-none transition-colors hover:bg-[#A94467] focus-visible:ring-2 focus-visible:ring-[#C2557A] focus-visible:ring-offset-2"
              >
                {nextLabel}
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <p className="mt-3 text-center text-xs text-[#8C6F7B]">هتراجع طلبك بالكامل قبل التأكيد النهائي.</p>
            </>
          )}
          {isWa && waLink && (
            <div role="status" className="mt-4 rounded-2xl border border-[#BFE8CF] bg-[#F1FBF5] p-4 text-center text-sm text-[#4A2C3A]">
              <p className="font-bold">الرسالة جاهزة على واتساب</p>
              <p className="mt-1 text-xs leading-5 text-[#8C6F7B]">لو واتساب ماتفتحش، اضغط هنا. وبعد ما تبعت الطلب تقدر تفرّغ السلة.</p>
              <a href={waLink} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex h-10 items-center gap-2 rounded-full bg-[#1FAF5A] px-5 text-xs font-bold text-white hover:bg-[#188A47]">
                <MessageCircle className="h-4 w-4" aria-hidden="true" />افتح واتساب
              </a>
              <button type="button" onClick={() => { clearCart(); navigate("/"); }} className="mt-3 block w-full text-xs text-[#8C6F7B] underline hover:text-[#C2557A]">
                أرسلت الطلب، فرّغ السلة
              </button>
            </div>
          )}
          <Link to="/" className="mt-3 block text-center text-sm text-[#8C6F7B] hover:text-[#C2557A]">متابعة التسوق</Link>
        </aside>
      </form>
    </PageShell>
  );
}
