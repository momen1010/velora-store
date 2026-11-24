import { useMemo, useState } from "react";
import { useAdminData, ORDERS_LIMIT } from "../DataContext";
import { Card, Empty, ErrorState, Modal, StatusBadge, TableSkeleton, dateTime, inputCls, money } from "../components/ui";

const toDate = (t) => (t?.toDate ? t.toDate() : null);

// لا توجد حسابات عملاء في المتجر (الطلب بدون تسجيل)، فالعميل = رقم الموبايل ويُجمَّع من الطلبات.
export default function Customers() {
  const { orders } = useAdminData();
  const [q, setQ] = useState(""); const [sort, setSort] = useState("spend"); const [open, setOpen] = useState(null);

  const customers = useMemo(() => {
    const m = new Map();
    for (const o of orders.rows) {
      const ph = o.customer?.phone; if (!ph) continue;
      const c = m.get(ph) ?? { phone: ph, name: o.customer.name, governorate: o.customer.governorate, orders: [], spend: 0, first: null, last: null };
      c.orders.push(o);
      if (o.status !== "cancelled") c.spend += o.total;
      const d = toDate(o.createdAt);
      if (d && (!c.first || d < c.first)) c.first = d;
      if (d && (!c.last || d > c.last)) { c.last = d; c.name = o.customer.name; }
      m.set(ph, c);
    }
    return [...m.values()];
  }, [orders.rows]);

  const list = useMemo(() => {
    const r = customers.filter((c) => !q || c.name.toLowerCase().includes(q.toLowerCase()) || c.phone.includes(q));
    return r.sort((a, b) => (sort === "spend" ? b.spend - a.spend : sort === "orders" ? b.orders.length - a.orders.length : (b.last?.getTime() ?? 0) - (a.last?.getTime() ?? 0)));
  }, [customers, q, sort]);
  const cur = customers.find((c) => c.phone === open);

  return (
    <div className="space-y-4">
      <div><h1 className="text-xl font-bold">العملاء</h1><p className="text-xs text-stone-500">يُجمَّع العميل برقم الموبايل من الطلبات{orders.rows.length >= ORDERS_LIMIT ? ` (آخر ${ORDERS_LIMIT} طلب)` : ""}. بيانات العملاء ظاهرة للإدارة فقط.</p></div>
      <Card>
        <div className="grid gap-3 border-b border-stone-100 p-4 sm:grid-cols-2">
          <input className={inputCls} placeholder="بحث بالاسم أو الموبايل" value={q} onChange={(e) => setQ(e.target.value)} aria-label="بحث" />
          <select className={inputCls} value={sort} onChange={(e) => setSort(e.target.value)} aria-label="الترتيب"><option value="spend">الأعلى إنفاقاً</option><option value="orders">الأكثر طلباً</option><option value="recent">الأحدث</option></select>
        </div>
        {orders.error && <ErrorState message={orders.error} />}
        {orders.loading ? <TableSkeleton /> : list.length === 0 ? <Empty title="لا يوجد عملاء بعد" /> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm">
            <thead className="bg-stone-50 text-xs text-stone-500"><tr>{["العميل", "الموبايل", "الطلبات", "إجمالي الإنفاق", "أول طلب", "آخر طلب"].map((h) => <th key={h} className="px-3 py-2 text-start font-medium">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-stone-100">{list.map((c) => (
              <tr key={c.phone} onClick={() => setOpen(c.phone)} className="cursor-pointer hover:bg-stone-50"><td className="px-3 py-2.5 font-medium">{c.name}<div className="text-xs text-stone-400">{c.governorate}</div></td><td className="px-3 py-2.5" dir="ltr">{c.phone}</td><td className="px-3 py-2.5">{c.orders.length}</td><td className="px-3 py-2.5 font-medium">{money(c.spend)}</td><td className="px-3 py-2.5 text-xs text-stone-500">{c.first ? dateTime(c.first) : "-"}</td><td className="px-3 py-2.5 text-xs text-stone-500">{c.last ? dateTime(c.last) : "-"}</td></tr>))}</tbody></table></div>)}
      </Card>
      <Modal open={Boolean(cur)} title={cur?.name ?? ""} onClose={() => setOpen(null)}>
        {cur && <div className="space-y-3 text-sm"><p dir="ltr" className="text-end">{cur.phone}</p>
          <p>عدد الطلبات: <b>{cur.orders.length}</b> · إجمالي الإنفاق: <b>{money(cur.spend)}</b></p>
          <ul className="divide-y divide-stone-100 rounded-xl border border-stone-200">{cur.orders.map((o) => <li key={o.id} className="flex items-center justify-between gap-2 px-3 py-2"><span>{o.id}<span className="block text-xs text-stone-400">{dateTime(o.createdAt)}</span></span><StatusBadge status={o.status} /><b>{money(o.total)}</b></li>)}</ul></div>}
      </Modal>
    </div>
  );
}
