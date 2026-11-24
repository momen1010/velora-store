import { useEffect, useRef, useState } from "react";
import { doc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { Upload } from "lucide-react";
import { db } from "../../firebase/config";
import { Card, Field, Skeleton, btnGhost, btnPrimary, inputCls, useToast } from "../components/ui";
import { commitLogged, errMsg } from "../lib/adminWrite";
import { compressImage } from "../lib/image";

const EMPTY = { storeName: "", logo: "", phone: "", whatsapp: "", email: "", address: "", shippingFee: 50, freeShippingThreshold: 799, minOrderAmount: 0, hours: "", paymentMethods: { cod: true, wallet: true }, social: { instagram: "", facebook: "", tiktok: "" } };

export default function Settings() {
  const toast = useToast();
  const [f, setF] = useState(null); const [busy, setBusy] = useState(false); const [err, setErr] = useState(""); const fr = useRef(null);
  useEffect(() => onSnapshot(doc(db, "storeSettings", "main"), (s) => setF((p) => p ?? { ...EMPTY, ...s.data(), paymentMethods: { ...EMPTY.paymentMethods, ...s.data()?.paymentMethods }, social: { ...EMPTY.social, ...s.data()?.social } }), () => setErr("تعذّر تحميل الإعدادات")), []);
  if (!f) return <div className="space-y-3"><Skeleton className="h-8 w-40" /><Skeleton className="h-64" />{err && <p className="text-rose-600">{err}</p>}</div>;
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const num = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault(); setErr("");
    const fee = Number(f.shippingFee), thr = Number(f.freeShippingThreshold), min = Number(f.minOrderAmount);
    if (!f.storeName.trim()) return setErr("اسم المتجر مطلوب");
    if (![fee, thr, min].every((n) => Number.isFinite(n) && n >= 0)) return setErr("أرقام الشحن والحد الأدنى لازم تكون صفر أو أكثر");
    if (fee > 1000) return setErr("رسوم الشحن كبيرة جداً");
    setBusy(true);
    try {
      await commitLogged("settings.update", "storeSettings", "main", { fee, thr, min }, (b, logId) =>
        b.set(doc(db, "storeSettings", "main"), {
          storeName: f.storeName.replace(/[<>]/g, "").trim().slice(0, 80), logo: f.logo, phone: f.phone.slice(0, 30), whatsapp: f.whatsapp.replace(/\D/g, "").slice(0, 15),
          email: f.email.slice(0, 100), address: f.address.replace(/[<>]/g, "").slice(0, 200), shippingFee: fee, freeShippingThreshold: thr, minOrderAmount: min,
          hours: f.hours.replace(/[<>]/g, "").slice(0, 200), paymentMethods: f.paymentMethods, social: f.social, updatedAt: serverTimestamp(), lastLogId: logId,
        }));
      toast("تم حفظ الإعدادات. تطبَّق فوراً على المتجر والقواعد.");
    } catch (x) { setErr(errMsg(x)); } finally { setBusy(false); }
  };

  return (
    <form onSubmit={save} className="space-y-4">
      <h1 className="text-xl font-bold">إعدادات المتجر</h1>
      <Card title="بيانات المتجر"><div className="grid gap-3 p-4 sm:grid-cols-2">
        <Field label="اسم المتجر *"><input className={inputCls} value={f.storeName} onChange={set("storeName")} maxLength={80} /></Field>
        <Field label="رقم واتساب (دولي بدون +)"><input className={inputCls} dir="ltr" value={f.whatsapp} onChange={set("whatsapp")} placeholder="201012345678" /></Field>
        <Field label="رقم الهاتف"><input className={inputCls} dir="ltr" value={f.phone} onChange={set("phone")} /></Field>
        <Field label="الإيميل"><input className={inputCls} dir="ltr" type="email" value={f.email} onChange={set("email")} /></Field>
        <Field label="العنوان"><input className={inputCls} value={f.address} onChange={set("address")} /></Field>
        <Field label="مواعيد العمل"><input className={inputCls} value={f.hours} onChange={set("hours")} placeholder="يومياً من 10 ص إلى 10 م" /></Field>
        <div className="flex items-center gap-3 sm:col-span-2">{f.logo && <img src={f.logo} alt="" className="h-12 w-12 rounded-lg object-contain" />}
          <button type="button" className={btnGhost} onClick={() => fr.current?.click()}><Upload className="h-4 w-4" />الشعار</button>
          <input ref={fr} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={async (e) => { const file = e.target.files?.[0]; e.target.value = ""; if (!file) return; try { const d = await compressImage(file, 300); setF((p) => ({ ...p, logo: d })); } catch (x) { setErr(x.message); } }} /></div>
      </div></Card>
      <Card title="الشحن والطلبات"><div className="grid gap-3 p-4 sm:grid-cols-3">
        <Field label="رسوم الشحن (ج.م)"><input className={inputCls} type="number" min="0" value={f.shippingFee} onChange={num("shippingFee")} /></Field>
        <Field label="شحن مجاني فوق (ج.م)"><input className={inputCls} type="number" min="0" value={f.freeShippingThreshold} onChange={num("freeShippingThreshold")} /></Field>
        <Field label="أقل قيمة للطلب (ج.م)"><input className={inputCls} type="number" min="0" value={f.minOrderAmount} onChange={num("minOrderAmount")} /></Field>
      </div></Card>
      <Card title="طرق الدفع"><div className="flex flex-wrap gap-6 p-4 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={f.paymentMethods.cod} onChange={(e) => setF((p) => ({ ...p, paymentMethods: { ...p.paymentMethods, cod: e.target.checked } }))} />الدفع عند الاستلام</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={f.paymentMethods.wallet} onChange={(e) => setF((p) => ({ ...p, paymentMethods: { ...p.paymentMethods, wallet: e.target.checked } }))} />محفظة إلكترونية</label>
      </div></Card>
      <Card title="السوشيال ميديا"><div className="grid gap-3 p-4 sm:grid-cols-3">
        {["instagram", "facebook", "tiktok"].map((k) => <Field key={k} label={k}><input className={inputCls} dir="ltr" placeholder="https://" value={f.social[k]} onChange={(e) => setF((p) => ({ ...p, social: { ...p.social, [k]: e.target.value } }))} /></Field>)}
      </div></Card>
      {err && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{err}</p>}
      <button disabled={busy} className={btnPrimary}>{busy ? "جارٍ الحفظ..." : "حفظ الإعدادات"}</button>
    </form>
  );
}
