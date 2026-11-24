import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { db } from "../../firebase/config";
import { useAdminAuth } from "../AuthContext";
import { useAdminData } from "../DataContext";
import { Card, Confirm, Empty, ErrorState, Field, Modal, StatusBadge, TableSkeleton, btnGhost, btnPrimary, dateTime, inputCls, money, useToast } from "../components/ui";
import { NEXT_STATUS, PAYMENT_METHODS, PAYMENT_STATUSES, STATUSES } from "../lib/constants";
import { changeOrderStatus, updateOrderMeta } from "../lib/orderActions";
import { errMsg } from "../lib/adminWrite";

const PAGE = 15;
const toDate = (t) => (t?.toDate ? t.toDate() : null);

function OrderModal({ order, onClose }) {
  const { user } = useAdminAuth();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [notes, setNotes] = useState(order.internalNotes ?? "");
  const next = NEXT_STATUS[order.status] ?? [];

  const run = async (fn, ok) => {
    setBusy(true);
    try { await fn(); toast(ok); } catch (e) { toast(errMsg(e), "err"); } finally { setBusy(false); setConfirm(null); }
  };
  const c = order.customer ?? {};
  return (
    <Modal open title={`الطلب ${order.id}`} onClose={onClose} wide>
      <div className="grid gap-4 sm:grid-cols-2 text-sm">
        <div className="space-y-1"><p className="font-bold">العميل</p><p>{c.name}</p><p dir="ltr" className="text-end">{c.phone}</p><p className="text-stone-600">{c.governorate}، {c.city}</p><p className="text-stone-600">{c.address}</p>{c.notes && <p className="rounded-lg bg-amber-50 p-2 text-amber-800">ملاحظة العميل: {c.notes}</p>}</div>
        <div className="space-y-1"><p className="font-bold">الطلب</p><p>التاريخ: {dateTime(order.createdAt)}</p><p>الحالة: <StatusBadge status={order.status} /></p>
          <p>الدفع: {PAYMENT_METHODS[order.paymentMethod]} · {PAYMENT_STATUSES[order.paymentStatus ?? "unpaid"]}</p>
          {order.walletSender && <p>حُوّل من: <span dir="ltr">{order.walletSender}</span></p>}</div>
      </div>
      <div className="mt-4 overflow-x-auto rounded-xl border border-stone-200"><table className="w-full text-sm"><thead className="bg-stone-50 text-xs text-stone-500"><tr><th className="p-2 text-start">المنتج</th><th className="p-2">الكمية</th><th className="p-2">السعر</th><th className="p-2">الإجمالي</th></tr></thead>
        <tbody className="divide-y divide-stone-100">{order.items.map((i) => <tr key={i.cartItemId}><td className="p-2">{i.name}{i.shade && <span className="text-xs text-stone-500"> ({i.shade.name})</span>}<div className="text-xs text-stone-400">{i.cartItemId}</div></td><td className="p-2 text-center">{i.quantity}</td><td className="p-2 text-center">{money(i.price)}</td><td className="p-2 text-center">{money(i.price * i.quantity)}</td></tr>)}</tbody></table></div>
      <dl className="mt-3 space-y-1 text-sm">
        <div className="flex justify-between"><dt className="text-stone-500">المجموع الفرعي</dt><dd>{money(order.subtotal)}</dd></div>
        <div className="flex justify-between"><dt className="text-stone-500">رسوم الشحن</dt><dd>{money(order.shipping)}</dd></div>
        <div className="flex justify-between"><dt className="text-stone-500">الخصم{order.promoCode ? ` (${order.promoCode})` : ""}</dt><dd>{money(order.discount ?? 0)}</dd></div>
        <div className="flex justify-between border-t pt-2 text-base font-bold"><dt>الإجمالي النهائي</dt><dd>{money(order.total)}</dd></div>
      </dl>

      <div className="mt-5 space-y-3 border-t border-stone-100 pt-4">
        <p className="text-sm font-bold">إجراءات</p>
        <div className="flex flex-wrap gap-2">
          {next.length === 0 && <span className="text-sm text-stone-500">الطلب في حالة نهائية.</span>}
          {next.map((s) => (
            <button key={s} disabled={busy} onClick={() => setConfirm(s)} className={s === "cancelled" ? "inline-flex h-10 items-center rounded-lg bg-rose-50 px-4 text-sm font-bold text-rose-700 hover:bg-rose-100" : btnPrimary}>
              {s === "confirmed" ? "تأكيد الطلب" : s === "cancelled" ? "إلغاء / رفض" : `نقل إلى: ${STATUSES[s].label}`}
            </button>
          ))}
        </div>
        <div className="flex items-end gap-2">
          <Field label="حالة الدفع">
            <select className={inputCls} value={order.paymentStatus ?? "unpaid"} disabled={busy}
              onChange={(e) => run(() => updateOrderMeta(db, user, order, { paymentStatus: e.target.value }), "تم تحديث حالة الدفع")}>
              {Object.entries(PAYMENT_STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
        </div>
        <Field label="ملاحظات داخلية (لا تظهر للعميل)">
          <textarea className={`${inputCls} h-20 py-2`} maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        <button disabled={busy || notes === (order.internalNotes ?? "")} className={btnGhost} onClick={() => run(() => updateOrderMeta(db, user, order, { internalNotes: notes }), "تم حفظ الملاحظة")}>حفظ الملاحظة</button>
      </div>

      <div className="mt-5 border-t border-stone-100 pt-4">
        <p className="mb-2 text-sm font-bold">سجل الطلب</p>
        <ol className="space-y-1 text-sm text-stone-600">
          <li>{dateTime(order.createdAt)}: تم إنشاء الطلب</li>
          {(order.statusHistory ?? []).map((h, i) => <li key={i}>{dateTime(h.at)}: {STATUSES[h.status]?.label ?? h.status} · {h.by}</li>)}
        </ol>
      </div>
      <Confirm open={Boolean(confirm)} title="تأكيد الإجراء" danger={confirm === "cancelled"} busy={busy}
        message={confirm === "cancelled" ? "سيتم إلغاء الطلب نهائياً، وإرجاع المخزون لو كان قد خُصم. لا يمكن التراجع." : confirm === "confirmed" ? "سيتم تأكيد الطلب وخصم الكميات من المخزون." : `نقل الطلب إلى "${STATUSES[confirm]?.label}"؟`}
        onCancel={() => setConfirm(null)} onConfirm={() => run(() => changeOrderStatus(db, user, order.id, confirm), "تم تحديث حالة الطلب")} />
    </Modal>
  );
}

export default function Orders() {
  const { orders } = useAdminData();
  const [sp, setSp] = useSearchParams();
  const [status, setStatus] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState("new");
  const [page, setPage] = useState(0);
  const [openId, setOpenId] = useState(null);
  const q = (sp.get("q") ?? "").trim().toLowerCase();

  const list = useMemo(() => {
    let r = orders.rows;
    if (q) r = r.filter((o) => o.id.toLowerCase().includes(q) || (o.customer?.name ?? "").toLowerCase().includes(q) || (o.customer?.phone ?? "").includes(q));
    if (status !== "all") r = r.filter((o) => o.status === status);
    if (from) r = r.filter((o) => (toDate(o.createdAt)?.getTime() ?? 0) >= new Date(from).getTime());
    if (to) r = r.filter((o) => (toDate(o.createdAt)?.getTime() ?? 0) < new Date(to).getTime() + 86400000);
    const s = [...r];
    if (sort === "old") s.reverse();
    if (sort === "high") s.sort((a, b) => b.total - a.total);
    if (sort === "low") s.sort((a, b) => a.total - b.total);
    return s;
  }, [orders.rows, q, status, from, to, sort]);

  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  const cur = Math.min(page, pages - 1);
  const slice = list.slice(cur * PAGE, cur * PAGE + PAGE);
  const open = orders.rows.find((o) => o.id === openId);
  const reset = (fn) => (e) => { fn(e.target.value); setPage(0); };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">الطلبات</h1>
      <Card>
        <div className="grid gap-3 border-b border-stone-100 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <input className={inputCls} placeholder="بحث: رقم الطلب / الاسم / الموبايل" value={sp.get("q") ?? ""} onChange={(e) => { setSp(e.target.value ? { q: e.target.value } : {}); setPage(0); }} aria-label="بحث" />
          <select className={inputCls} value={status} onChange={reset(setStatus)} aria-label="الحالة"><option value="all">كل الحالات</option>{Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
          <input className={inputCls} type="date" value={from} onChange={reset(setFrom)} aria-label="من تاريخ" />
          <input className={inputCls} type="date" value={to} onChange={reset(setTo)} aria-label="إلى تاريخ" />
          <select className={inputCls} value={sort} onChange={reset(setSort)} aria-label="الترتيب"><option value="new">الأحدث</option><option value="old">الأقدم</option><option value="high">الأعلى قيمة</option><option value="low">الأقل قيمة</option></select>
        </div>
        {orders.error && <ErrorState message={orders.error} />}
        {orders.loading ? <TableSkeleton /> : slice.length === 0 ? <Empty title="لا توجد طلبات مطابقة" /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-stone-50 text-xs text-stone-500"><tr>{["الطلب", "العميل", "الموبايل", "الدفع", "الإجمالي", "التاريخ", "الحالة", ""].map((h) => <th key={h} className="px-3 py-2 text-start font-medium">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-stone-100">{slice.map((o) => (
                <tr key={o.id} className="hover:bg-stone-50">
                  <td className="px-3 py-2.5 font-medium">{o.id}</td><td className="px-3 py-2.5">{o.customer?.name}</td><td className="px-3 py-2.5" dir="ltr">{o.customer?.phone}</td>
                  <td className="px-3 py-2.5 text-xs">{PAYMENT_METHODS[o.paymentMethod]}<div className="text-stone-400">{PAYMENT_STATUSES[o.paymentStatus ?? "unpaid"]}</div></td>
                  <td className="px-3 py-2.5 font-medium">{money(o.total)}</td><td className="px-3 py-2.5 text-xs text-stone-500">{dateTime(o.createdAt)}</td>
                  <td className="px-3 py-2.5"><StatusBadge status={o.status} /></td>
                  <td className="px-3 py-2.5"><button onClick={() => setOpenId(o.id)} aria-label="عرض" className="rounded-lg p-2 text-stone-500 hover:bg-stone-100"><Eye className="h-4 w-4" /></button></td>
                </tr>))}</tbody>
            </table>
          </div>)}
        <div className="flex items-center justify-between border-t border-stone-100 px-4 py-3 text-sm text-stone-600">
          <span>{list.length} طلب</span>
          <div className="flex items-center gap-2">
            <button className={btnGhost} disabled={cur === 0} onClick={() => setPage(cur - 1)} aria-label="السابق"><ChevronRight className="h-4 w-4" /></button>
            <span>{cur + 1} / {pages}</span>
            <button className={btnGhost} disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)} aria-label="التالي"><ChevronLeft className="h-4 w-4" /></button>
          </div>
        </div>
      </Card>
      {open && <OrderModal key={open.id} order={open} onClose={() => setOpenId(null)} />}
    </div>
  );
}
