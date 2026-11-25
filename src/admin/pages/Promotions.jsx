import { useEffect, useMemo, useState } from "react";
import { collection, doc, onSnapshot, query, serverTimestamp, Timestamp } from "firebase/firestore";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { db } from "../../firebase/config";
import { useAdminData } from "../DataContext";
import { Card, Confirm, Empty, ErrorState, Field, Modal, TableSkeleton, btnGhost, btnPrimary, dateTime, inputCls, money, useToast } from "../components/ui";
import { commitLogged, errMsg } from "../lib/adminWrite";

const toDateInput = (t) =>
  t?.toDate
    ? new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit" }).format(t.toDate())
    : "";

// نفسّر التاريخ المُدخل على توقيت القاهرة مهما كانت منطقة متصفح الأدمن
const cairoWall = (ymd, time) => {
  const guess = Date.parse(`${ymd}T${time}.000Z`);
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).formatToParts(guess);
  const p = Object.fromEntries(parts.filter((x) => x.type !== "literal").map((x) => [x.type, x.value]));
  const offset = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second) - guess;
  return new Date(guess - offset);
};

function PromoForm({ promo, existing, onClose }) {
  const toast = useToast();
  const [f, setF] = useState({ code: promo?.id ?? "", type: promo?.type ?? "percent", value: promo?.value ?? "", minOrder: promo?.minOrder ?? 0, usageLimit: promo?.usageLimit ?? 0, startsAt: toDateInput(promo?.startsAt), expiresAt: toDateInput(promo?.expiresAt), active: promo?.active ?? true, description: promo?.description ?? "" });
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  const save = async (e) => {
    e.preventDefault(); setErr("");
    const code = f.code.trim().toUpperCase(); const value = Number(f.value);
    if (!/^[A-Z0-9_-]{3,30}$/.test(code)) return setErr("الكود: 3 إلى 30 حرف إنجليزي كبير أو أرقام أو - _");
    if (!promo && existing.includes(code)) return setErr("الكود موجود بالفعل");
    if (!(value > 0)) return setErr("قيمة الخصم لازم تكون أكبر من صفر");
    if (f.type === "percent" && value > 100) return setErr("النسبة لا تزيد عن 100");
    setBusy(true);
    try {
      await commitLogged(promo ? "promo.update" : "promo.create", "promotions", code, { type: f.type, value }, (b, logId) =>
        b.set(doc(db, "promotions", code), {
          type: f.type, value, minOrder: Math.max(0, Number(f.minOrder) || 0), usageLimit: Math.max(0, Math.trunc(Number(f.usageLimit) || 0)),
          usedCount: promo?.usedCount ?? 0, startsAt: f.startsAt ? Timestamp.fromDate(cairoWall(f.startsAt, "00:00:00")) : null,
          expiresAt: f.expiresAt ? Timestamp.fromDate(cairoWall(f.expiresAt, "23:59:59")) : null,
          active: f.active, description: f.description.replace(/[<>]/g, "").slice(0, 200),
          createdAt: promo?.createdAt ?? serverTimestamp(), updatedAt: serverTimestamp(), lastLogId: logId,
        }));
      toast("تم الحفظ"); onClose();
    } catch (x) { setErr(errMsg(x)); } finally { setBusy(false); }
  };
  return (
    <Modal open title={promo ? "تعديل عرض" : "عرض جديد"} onClose={onClose}>
      <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
        <Field label="الكود *"><input className={inputCls} dir="ltr" disabled={Boolean(promo)} value={f.code} onChange={(e) => setF((p) => ({ ...p, code: e.target.value.toUpperCase() }))} maxLength={30} /></Field>
        <Field label="النوع"><select className={inputCls} value={f.type} onChange={set("type")}><option value="percent">نسبة %</option><option value="fixed">مبلغ ثابت</option></select></Field>
        <Field label={f.type === "percent" ? "النسبة %" : "المبلغ (ج.م)"}><input className={inputCls} type="number" min="0" step="0.01" value={f.value} onChange={set("value")} /></Field>
        <Field label="الحد الأدنى للطلب"><input className={inputCls} type="number" min="0" value={f.minOrder} onChange={set("minOrder")} /></Field>
        <Field label="حد الاستخدام (0 = بلا حد)"><input className={inputCls} type="number" min="0" step="1" value={f.usageLimit} onChange={set("usageLimit")} /></Field>
        <Field label="تاريخ البداية (اختياري)"><input className={inputCls} type="date" value={f.startsAt} onChange={set("startsAt")} /></Field>
        <Field label="تاريخ الانتهاء"><input className={inputCls} type="date" value={f.expiresAt} onChange={set("expiresAt")} /></Field>
        <div className="sm:col-span-2"><Field label="وصف داخلي"><input className={inputCls} maxLength={200} value={f.description} onChange={set("description")} /></Field></div>
        <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={f.active} onChange={set("active")} />مفعّل</label>
        {err && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 sm:col-span-2">{err}</p>}
        <div className="flex justify-end gap-2 sm:col-span-2"><button type="button" className={btnGhost} onClick={onClose}>إلغاء</button><button disabled={busy} className={btnPrimary}>{busy ? "..." : "حفظ"}</button></div>
      </form>
    </Modal>
  );
}

export default function Promotions() {
  const { orders } = useAdminData();
  const toast = useToast();
  const [s, setS] = useState({ rows: [], loading: true, error: "" });
  const [nowMs] = useState(() => Date.now());
  const [edit, setEdit] = useState(null); const [del, setDel] = useState(null); const [busy, setBusy] = useState(false);
  useEffect(() => onSnapshot(query(collection(db, "promotions")), (snap) => setS({ rows: snap.docs.map((d) => ({ id: d.id, ...d.data() })), loading: false, error: "" }), () => setS({ rows: [], loading: false, error: "تعذّر تحميل العروض." })), []);

  const stats = useMemo(() => {
    const m = new Map();
    for (const o of orders.rows) if (o.promoCode && o.status !== "cancelled") { const c = m.get(o.promoCode) ?? { n: 0, disc: 0 }; c.n++; c.disc += o.discount ?? 0; m.set(o.promoCode, c); }
    return m;
  }, [orders.rows]);

  const toggle = async (p) => {
    const { id, ...rest } = p; setBusy(true);
    try { await commitLogged("promo.toggle", "promotions", id, { active: !p.active }, (b, l) => b.set(doc(db, "promotions", id), { ...rest, active: !p.active, updatedAt: serverTimestamp(), lastLogId: l })); } catch (e) { toast(errMsg(e), "err"); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-xl font-bold">العروض وأكواد الخصم</h1><button className={btnPrimary} onClick={() => setEdit({})}><Plus className="h-4 w-4" />عرض جديد</button></div>
      <Card>
        {s.error && <ErrorState message={s.error} />}
        {s.loading ? <TableSkeleton rows={4} /> : s.rows.length === 0 ? <Empty title="لا توجد عروض" hint="أنشئ كود خصم ليظهر للعملاء في صفحة الدفع." /> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-sm">
            <thead className="bg-stone-50 text-xs text-stone-500"><tr>{["الكود", "الخصم", "الحد الأدنى", "الاستخدام", "طلبات (غير ملغية)", "الانتهاء", "الحالة", ""].map((h) => <th key={h} className="px-3 py-2 text-start font-medium">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-stone-100">{s.rows.map((p) => { const st = stats.get(p.id); const expired = p.expiresAt?.toMillis && p.expiresAt.toMillis() < nowMs; const notStarted = p.startsAt?.toMillis && p.startsAt.toMillis() > nowMs; return (
              <tr key={p.id}><td className="px-3 py-2.5 font-bold" dir="ltr">{p.id}</td><td className="px-3 py-2.5">{p.type === "percent" ? `${p.value}%` : money(p.value)}</td><td className="px-3 py-2.5">{money(p.minOrder)}</td>
                <td className="px-3 py-2.5">{p.usedCount ?? 0}{p.usageLimit ? ` / ${p.usageLimit}` : " / ∞"}</td><td className="px-3 py-2.5">{st ? `${st.n} (خصم ${money(st.disc)})` : "0"}</td>
                <td className="px-3 py-2.5 text-xs">{p.expiresAt ? dateTime(p.expiresAt) : "بلا انتهاء"}</td>
                <td className="px-3 py-2.5"><button disabled={busy} onClick={() => toggle(p)} className={`rounded-full px-2.5 py-0.5 text-xs ${expired || !p.active ? "bg-stone-100 text-stone-500" : notStarted ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{expired ? "منتهي" : !p.active ? "موقوف" : notStarted ? "مجدول" : "مفعّل"}</button></td>
                <td className="whitespace-nowrap px-3 py-2.5"><button aria-label="تعديل" onClick={() => setEdit(p)} className="rounded-lg p-2 text-stone-500 hover:bg-stone-100"><Pencil className="h-4 w-4" /></button><button aria-label="حذف" onClick={() => setDel(p)} className="rounded-lg p-2 text-rose-500 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button></td></tr>); })}</tbody></table></div>)}
      </Card>
      <p className="text-xs text-stone-500">عدّاد الاستخدام يزيد عند تأكيد الطلب (وليس عند إنشائه)، فالحد قد يُتجاوز مؤقتاً بطلبات قيد المراجعة.</p>
      {edit && <PromoForm promo={edit.id ? edit : null} existing={s.rows.map((r) => r.id)} onClose={() => setEdit(null)} />}
      <Confirm open={Boolean(del)} danger busy={busy} title="حذف العرض" message={`حذف الكود "${del?.id}" نهائياً؟ الطلبات القديمة لا تتأثر.`} onCancel={() => setDel(null)}
        onConfirm={async () => { setBusy(true); try { await commitLogged("promo.delete", "promotions", del.id, {}, (b) => b.delete(doc(db, "promotions", del.id))); toast("تم الحذف"); } catch (e) { toast(errMsg(e), "err"); } finally { setBusy(false); setDel(null); } }} />
    </div>
  );
}
