import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Banknote, Clock, CheckCircle2, PackageX, ShoppingBag, Boxes, Users } from "lucide-react";
import { useAdminData, ORDERS_LIMIT } from "../DataContext";
import { Card, Empty, ErrorState, Skeleton, StatusBadge, dateTime, money } from "../components/ui";
import { STATUSES } from "../lib/constants";

const PIE_COLORS = ["#d97706", "#0284c7", "#4f46e5", "#7c3aed", "#ea580c", "#059669", "#e11d48"];
const DAY = 86400000;
const toDate = (t) => (t?.toDate ? t.toDate() : t ? new Date(t) : null);

function Stat({ Icon, label, value, loading, tone = "text-stone-700" }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
      <div className="flex items-center justify-between text-stone-500"><span className="text-xs font-medium">{label}</span><Icon className="h-4 w-4" aria-hidden="true" /></div>
      <div className={`mt-2 text-2xl font-bold ${tone}`}>{loading ? <Skeleton className="h-8 w-24" /> : value}</div>
    </div>
  );
}

// يجمّع الإيراد (طلبات غير ملغية) حسب اليوم أو الأسبوع أو الشهر
function buildSeries(orders, period) {
  const now = new Date();
  const buckets = new Map();
  const count = period === "daily" ? 14 : period === "weekly" ? 12 : 12;
  const keyOf = (d) => {
    if (period === "daily") return d.toISOString().slice(0, 10);
    if (period === "monthly") return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const t = new Date(d); t.setHours(0, 0, 0, 0); t.setDate(t.getDate() - ((t.getDay() + 1) % 7)); // بداية الأسبوع السبت
    return t.toISOString().slice(0, 10);
  };
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now);
    if (period === "daily") d.setDate(d.getDate() - i);
    else if (period === "weekly") d.setDate(d.getDate() - i * 7);
    else d.setMonth(d.getMonth() - i, 1);
    buckets.set(keyOf(d), { key: keyOf(d), revenue: 0, orders: 0 });
  }
  for (const o of orders) {
    const d = toDate(o.createdAt);
    if (!d || o.status === "cancelled") continue;
    const b = buckets.get(keyOf(d));
    if (b) { b.revenue += o.total; b.orders += 1; }
  }
  return [...buckets.values()];
}

export default function Dashboard() {
  const { orders, products } = useAdminData();
  const [period, setPeriod] = useState("daily");
  const rows = orders.rows;

  const stats = useMemo(() => {
    const active = rows.filter((o) => o.status !== "cancelled");
    const phones = new Set(rows.map((o) => o.customer?.phone).filter(Boolean));
    const dist = Object.keys(STATUSES).map((k) => ({ key: k, name: STATUSES[k].label, value: rows.filter((o) => o.status === k).length })).filter((x) => x.value > 0);
    const sold = new Map();
    for (const o of active) for (const i of o.items ?? []) {
      const cur = sold.get(String(i.id)) ?? { id: String(i.id), name: i.name, qty: 0, revenue: 0 };
      cur.qty += i.quantity; cur.revenue += i.quantity * i.price; sold.set(String(i.id), cur);
    }
    return {
      revenue: rows.filter((o) => o.status === "delivered").reduce((s, o) => s + o.total, 0),
      expected: active.filter((o) => o.status !== "delivered").reduce((s, o) => s + o.total, 0),
      orders: rows.length,
      pending: rows.filter((o) => o.status === "pending").length,
      completed: rows.filter((o) => o.status === "delivered").length,
      customers: phones.size,
      dist,
      best: [...sold.values()].sort((a, b) => b.qty - a.qty).slice(0, 5),
    };
  }, [rows]);

  const series = useMemo(() => buildSeries(rows, period), [rows, period]);
  const prodActive = products.rows.filter((p) => p.active).length;
  const lowStock = products.rows.filter((p) => p.trackStock && p.stock <= (p.lowStockThreshold ?? 5));
  const loading = orders.loading || products.loading;
  const err = orders.error || products.error;
  const labelFor = (k) => (period === "monthly" ? k : new Date(k).toLocaleDateString("ar-EG", { day: "numeric", month: "short" }));
  void DAY;

  return (
    <div className="space-y-5">
      <div className="flex items-baseline justify-between"><h1 className="text-xl font-bold">لوحة التحكم</h1>
        {rows.length >= ORDERS_LIMIT && <span className="text-xs text-stone-500">الأرقام مبنية على آخر {ORDERS_LIMIT} طلب</span>}</div>
      {err && <ErrorState message={err} />}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat Icon={Banknote} label="الإيرادات (طلبات مُسلّمة)" value={money(stats.revenue)} loading={loading} tone="text-emerald-700" />
        <Stat Icon={ShoppingBag} label="إجمالي الطلبات" value={stats.orders} loading={loading} />
        <Stat Icon={Clock} label="طلبات قيد المراجعة" value={stats.pending} loading={loading} tone="text-amber-700" />
        <Stat Icon={CheckCircle2} label="طلبات مكتملة" value={stats.completed} loading={loading} />
        <Stat Icon={Users} label="العملاء" value={stats.customers} loading={loading} />
        <Stat Icon={Boxes} label="المنتجات المفعّلة" value={prodActive} loading={loading} />
        <Stat Icon={PackageX} label="مخزون منخفض" value={lowStock.length} loading={loading} tone={lowStock.length ? "text-rose-700" : "text-stone-700"} />
        <Stat Icon={Banknote} label="إيرادات متوقعة (قيد التنفيذ)" value={money(stats.expected)} loading={loading} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2" title="الإيرادات" action={
          <div className="flex rounded-lg bg-stone-100 p-0.5 text-xs">
            {[["daily", "يومي"], ["weekly", "أسبوعي"], ["monthly", "شهري"]].map(([k, l]) => (
              <button key={k} onClick={() => setPeriod(k)} className={`rounded-md px-3 py-1 font-medium ${period === k ? "bg-white shadow-sm" : "text-stone-500"}`}>{l}</button>
            ))}
          </div>}>
          <div className="h-64 p-3" dir="ltr">
            {loading ? <Skeleton className="h-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
                  <XAxis dataKey="key" tickFormatter={labelFor} tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} width={48} />
                  <Tooltip formatter={(v, n) => [n === "revenue" ? money(v) : v, n === "revenue" ? "الإيراد" : "الطلبات"]} labelFormatter={labelFor} />
                  <Area type="monotone" dataKey="revenue" stroke="#be185d" fill="#fce7f3" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
        <Card title="توزيع حالات الطلبات">
          {stats.dist.length === 0 ? <Empty title="لا توجد طلبات بعد" /> : (
            <div className="p-3">
              <div className="h-44" dir="ltr"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={stats.dist} dataKey="value" nameKey="name" innerRadius={42} outerRadius={70}>{stats.dist.map((d) => <Cell key={d.key} fill={PIE_COLORS[Object.keys(STATUSES).indexOf(d.key) % PIE_COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
              <ul className="mt-2 space-y-1 text-sm">{stats.dist.map((d) => <li key={d.key} className="flex justify-between"><span className="text-stone-600">{d.name}</span><b>{d.value}</b></li>)}</ul>
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2" title="آخر الطلبات" action={<Link to="/admin/orders" className="text-xs font-medium text-pink-700">عرض الكل</Link>}>
          {loading ? <div className="space-y-2 p-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-8" />)}</div> : rows.length === 0 ? <Empty title="لا توجد طلبات" /> : (
            <div className="overflow-x-auto"><table className="w-full text-sm"><tbody className="divide-y divide-stone-100">
              {rows.slice(0, 6).map((o) => (
                <tr key={o.id}><td className="px-4 py-2.5"><Link to={`/admin/orders?q=${o.id}`} className="font-medium text-stone-900">{o.id}</Link><div className="text-xs text-stone-500">{o.customer?.name}</div></td>
                  <td className="px-2 py-2.5 text-xs text-stone-500">{dateTime(o.createdAt)}</td><td className="px-2 py-2.5"><StatusBadge status={o.status} /></td><td className="px-4 py-2.5 font-medium">{money(o.total)}</td></tr>
              ))}</tbody></table></div>)}
        </Card>
        <Card title="الأكثر مبيعاً">
          {stats.best.length === 0 ? <Empty title="لا توجد مبيعات بعد" /> : (
            <ol className="divide-y divide-stone-100">{stats.best.map((b, i) => (
              <li key={b.id} className="flex items-center gap-3 px-4 py-2.5 text-sm"><span className="w-5 text-stone-400">{i + 1}</span><span className="flex-1 truncate">{b.name}</span><b>{b.qty}</b></li>))}</ol>)}
        </Card>
      </div>
    </div>
  );
}
