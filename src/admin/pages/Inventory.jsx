import { useEffect, useMemo, useState } from "react";
import { collection, doc, limit, onSnapshot, orderBy, query, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase/config";
import { useAdminAuth } from "../AuthContext";
import { useAdminData } from "../DataContext";
import { Card, Empty, ErrorState, Field, Modal, TableSkeleton, btnGhost, btnPrimary, dateTime, inputCls, useToast } from "../components/ui";
import { errMsg, newId } from "../lib/adminWrite";

// تعديل المخزون في transaction: يقرأ الرصيد الحالي، يمنع السالب، ويكتب سجل حركة + سجل أدمن
async function adjustStock(user, p, delta, reason) {
  await runTransaction(db, async (tx) => {
    const ref = doc(db, "products", p.id);
    const s = await tx.get(ref);
    if (!s.exists()) throw new Error("المنتج غير موجود");
    const cur = s.data().stock;
    const after = cur + delta;
    if (after < 0) throw new Error(`لا يمكن أن يصبح المخزون سالباً (الحالي ${cur})`);
    const invId = newId("inventoryLogs"); const logId = newId("adminLogs");
    tx.set(doc(db, "adminLogs", logId), { adminUid: user.uid, adminEmail: user.email ?? "", action: "inventory.adjust", target: "products", targetId: p.id, details: { delta, reason }, createdAt: serverTimestamp() });
    tx.set(doc(db, "inventoryLogs", invId), { productId: p.id, productName: p.name, change: delta, before: cur, after, reason, adminUid: user.uid, createdAt: serverTimestamp() });
    // المنتج: أي أدمن يقدر يعدّل المخزون فقط. باقي الحقول مرفوضة من القواعد.
    tx.update(ref, { stock: after, lastLogId: invId, updatedAt: serverTimestamp() });
  });
}

export default function Inventory() {
  const { products } = useAdminData();
  const { user } = useAdminAuth();
  const toast = useToast();
  const [filter, setFilter] = useState("alerts");
  const [adj, setAdj] = useState(null); const [delta, setDelta] = useState(""); const [reason, setReason] = useState(""); const [busy, setBusy] = useState(false);
  const [logs, setLogs] = useState({ rows: [], loading: true, error: "" });

  useEffect(() => onSnapshot(query(collection(db, "inventoryLogs"), orderBy("createdAt", "desc"), limit(50)),
    (s) => setLogs({ rows: s.docs.map((d) => ({ id: d.id, ...d.data() })), loading: false, error: "" }),
    () => setLogs({ rows: [], loading: false, error: "تعذّر تحميل سجل الحركة." })), []);

  const tracked = products.rows.filter((p) => p.trackStock);
  const status = (p) => (p.stock === 0 ? "out" : p.stock <= (p.lowStockThreshold ?? 5) ? "low" : "ok");
  const list = useMemo(() => tracked.filter((p) => (filter === "all" ? true : status(p) !== "ok")).sort((a, b) => a.stock - b.stock),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tracked, filter]);

  const submit = async (e) => {
    e.preventDefault();
    const d = Math.trunc(Number(delta));
    if (!d) return toast("اكتب كمية التعديل (موجبة للإضافة وسالبة للخصم)", "err");
    setBusy(true);
    try { await adjustStock(user, adj, d, reason.replace(/[<>]/g, "").slice(0, 100) || "تعديل يدوي"); toast("تم تعديل المخزون"); setAdj(null); setDelta(""); setReason(""); } catch (x) { toast(errMsg(x), "err"); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">المخزون</h1>
      <Card title="الأرصدة" action={<select className="h-8 rounded-lg border border-stone-200 px-2 text-xs" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="alerts">التنبيهات فقط</option><option value="all">كل المنتجات المتتبَّعة</option></select>}>
        {products.error && <ErrorState message={products.error} />}
        {products.loading ? <TableSkeleton /> : list.length === 0 ? <Empty title={filter === "alerts" ? "لا توجد تنبيهات مخزون" : "لا توجد منتجات"} /> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-sm"><tbody className="divide-y divide-stone-100">{list.map((p) => (
            <tr key={p.id}><td className="px-4 py-2.5 font-medium">{p.name}</td>
              <td className="px-3 py-2.5"><span className={`rounded-full px-2 py-0.5 text-xs ${status(p) === "out" ? "bg-rose-50 text-rose-700" : status(p) === "low" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{status(p) === "out" ? "نفد" : status(p) === "low" ? "منخفض" : "متوفر"}</span></td>
              <td className="px-3 py-2.5 font-bold">{p.stock}</td><td className="px-3 py-2.5 text-end"><button className={btnGhost} onClick={() => setAdj(p)}>تعديل</button></td></tr>))}</tbody></table></div>)}
      </Card>
      <Card title="سجل حركة المخزون (آخر 50)">
        {logs.error && <ErrorState message={logs.error} />}
        {logs.loading ? <TableSkeleton rows={4} /> : logs.rows.length === 0 ? <Empty title="لا توجد حركات بعد" /> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-sm"><tbody className="divide-y divide-stone-100">{logs.rows.map((l) => (
            <tr key={l.id}><td className="px-4 py-2">{l.productName}</td><td className={`px-3 py-2 font-bold ${l.change < 0 ? "text-rose-600" : "text-emerald-600"}`} dir="ltr">{l.change > 0 ? `+${l.change}` : l.change}</td>
              <td className="px-3 py-2 text-xs text-stone-500">{l.before} ← {l.after}</td><td className="px-3 py-2 text-xs text-stone-500">{l.reason}{l.orderId ? ` · ${l.orderId}` : ""}</td><td className="px-3 py-2 text-xs text-stone-400">{dateTime(l.createdAt)}</td></tr>))}</tbody></table></div>)}
      </Card>
      <Modal open={Boolean(adj)} title={`تعديل مخزون: ${adj?.name ?? ""}`} onClose={() => setAdj(null)}>
        <form onSubmit={submit} className="space-y-3">
          <p className="text-sm text-stone-500">الرصيد الحالي: <b>{adj?.stock}</b></p>
          <Field label="الكمية (+ إضافة / - خصم)"><input className={inputCls} type="number" step="1" value={delta} onChange={(e) => setDelta(e.target.value)} /></Field>
          <Field label="السبب"><input className={inputCls} maxLength={100} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="مثال: توريد جديد / جرد" /></Field>
          <div className="flex justify-end gap-2"><button type="button" className={btnGhost} onClick={() => setAdj(null)}>إلغاء</button><button disabled={busy} className={btnPrimary}>حفظ</button></div>
        </form>
      </Modal>
    </div>
  );
}
