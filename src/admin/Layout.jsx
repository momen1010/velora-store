import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Bell, ChevronsRight, ClipboardList, LayoutDashboard, LogOut, Menu, Package, Percent, Settings, Shapes, Users, Warehouse, X, Search, ExternalLink } from "lucide-react";
import { useAdminAuth } from "./AuthContext";
import { useAdminData } from "./DataContext";
import { ROLES } from "./lib/constants";
import { dateTime, money } from "./components/ui";
import { Link, useNavigate } from "react-router-dom";

const NAV = [
  { to: "/admin", label: "لوحة التحكم", Icon: LayoutDashboard, end: true },
  { to: "/admin/orders", label: "الطلبات", Icon: ClipboardList, area: "orders" },
  { to: "/admin/products", label: "المنتجات", Icon: Package, area: "products" },
  { to: "/admin/categories", label: "الأقسام", Icon: Shapes, area: "categories" },
  { to: "/admin/inventory", label: "المخزون", Icon: Warehouse, area: "inventory" },
  { to: "/admin/customers", label: "العملاء", Icon: Users, area: "customers" },
  { to: "/admin/promotions", label: "العروض", Icon: Percent, area: "promotions" },
  { to: "/admin/settings", label: "الإعدادات", Icon: Settings, area: "settings" },
];

function Sidebar({ collapsed, onNavigate }) {
  const { can } = useAdminAuth();
  return (
    <nav aria-label="القائمة الرئيسية" className="flex-1 space-y-1 p-3">
      {NAV.filter((n) => !n.area || can(n.area)).map(({ to, label, Icon, end }) => (
        <NavLink key={to} to={to} end={end} onClick={onNavigate} title={label}
          className={({ isActive }) => `flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition ${isActive ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100"}`}>
          <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
          {!collapsed && <span className="truncate">{label}</span>}
        </NavLink>
      ))}
    </nav>
  );
}

export default function Layout() {
  const { admin, logout } = useAdminAuth();
  const { orders, products } = useAdminData();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [menu, setMenu] = useState(false);
  const [bell, setBell] = useState(false);
  const [q, setQ] = useState("");

  const pending = orders.rows.filter((o) => o.status === "pending");
  const low = products.rows.filter((p) => p.trackStock && p.stock <= (p.lowStockThreshold ?? 5));

  const search = (e) => {
    e.preventDefault();
    if (q.trim()) navigate(`/admin/orders?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-stone-50 font-['Tajawal',system-ui,sans-serif] text-stone-900">
      <aside className={`fixed inset-y-0 right-0 z-30 hidden flex-col border-l border-stone-200 bg-white transition-all lg:flex ${collapsed ? "w-[68px]" : "w-60"}`}>
        <div className="flex h-14 items-center justify-between border-b border-stone-100 px-4">
          {!collapsed && <span className="text-lg font-bold">Velora</span>}
          <button onClick={() => setCollapsed((c) => !c)} aria-label="طي القائمة" className="rounded-md p-1.5 text-stone-500 hover:bg-stone-100"><ChevronsRight className={`h-4 w-4 transition ${collapsed ? "rotate-180" : ""}`} /></button>
        </div>
        <Sidebar collapsed={collapsed} />
      </aside>

      {mobile && (
        <div className="fixed inset-0 z-40 lg:hidden" onMouseDown={(e) => e.target === e.currentTarget && setMobile(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <aside className="absolute inset-y-0 right-0 flex w-64 flex-col bg-white">
            <div className="flex h-14 items-center justify-between border-b px-4"><span className="text-lg font-bold">Velora</span><button onClick={() => setMobile(false)} aria-label="إغلاق"><X className="h-5 w-5" /></button></div>
            <Sidebar onNavigate={() => setMobile(false)} />
          </aside>
        </div>
      )}

      <div className={`transition-all ${collapsed ? "lg:mr-[68px]" : "lg:mr-60"}`}>
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-stone-200 bg-white/90 px-4 backdrop-blur">
          <button onClick={() => setMobile(true)} aria-label="القائمة" className="rounded-md p-2 text-stone-600 hover:bg-stone-100 lg:hidden"><Menu className="h-5 w-5" /></button>
          <form onSubmit={search} className="relative hidden max-w-sm flex-1 sm:block">
            <Search className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-stone-400" aria-hidden="true" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث برقم الطلب أو الاسم أو الموبايل" aria-label="بحث" className="h-9 w-full rounded-lg border border-stone-200 bg-stone-50 pe-3 ps-3 pr-9 text-sm outline-none focus:border-stone-900" />
          </form>
          <div className="ms-auto flex items-center gap-1">
            <Link to="/" target="_blank" className="hidden items-center gap-1 rounded-lg px-3 py-2 text-sm text-stone-600 hover:bg-stone-100 sm:inline-flex"><ExternalLink className="h-4 w-4" aria-hidden="true" />المتجر</Link>
            <div className="relative">
              <button onClick={() => { setBell((b) => !b); setMenu(false); }} aria-label="الإشعارات" className="relative rounded-lg p-2 text-stone-600 hover:bg-stone-100">
                <Bell className="h-5 w-5" />
                {(pending.length + low.length) > 0 && <span className="absolute -top-0.5 -start-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">{pending.length + low.length}</span>}
              </button>
              {bell && (
                <div className="absolute end-0 mt-2 w-72 rounded-xl border border-stone-200 bg-white p-2 shadow-lg">
                  <p className="px-2 py-1 text-xs font-bold text-stone-500">الإشعارات</p>
                  {pending.length === 0 && low.length === 0 && <p className="p-3 text-sm text-stone-500">لا توجد إشعارات.</p>}
                  {pending.slice(0, 5).map((o) => (
                    <Link key={o.id} to={`/admin/orders?q=${o.id}`} onClick={() => setBell(false)} className="block rounded-lg px-2 py-2 text-sm hover:bg-stone-50">
                      طلب جديد <b>{o.id}</b><span className="block text-xs text-stone-500">{o.customer?.name} · {money(o.total)} · {dateTime(o.createdAt)}</span>
                    </Link>
                  ))}
                  {low.slice(0, 5).map((p) => (
                    <Link key={p.id} to="/admin/inventory" onClick={() => setBell(false)} className="block rounded-lg px-2 py-2 text-sm hover:bg-stone-50">
                      مخزون منخفض: <b>{p.name}</b><span className="block text-xs text-stone-500">المتبقي {p.stock}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <button onClick={() => { setMenu((m) => !m); setBell(false); }} className="flex h-9 items-center gap-2 rounded-lg px-2 hover:bg-stone-100" aria-label="الحساب">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-900 text-xs font-bold text-white">{(admin.email || "A")[0].toUpperCase()}</span>
              </button>
              {menu && (
                <div className="absolute end-0 mt-2 w-60 rounded-xl border border-stone-200 bg-white p-2 shadow-lg">
                  <div className="border-b border-stone-100 px-2 pb-2"><p className="truncate text-sm font-medium" dir="ltr">{admin.email}</p><p className="text-xs text-stone-500">{ROLES[admin.role]}</p></div>
                  <button onClick={() => logout()} className="mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-rose-600 hover:bg-rose-50"><LogOut className="h-4 w-4" />تسجيل الخروج</button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl p-4 lg:p-6"><Outlet /></main>
      </div>
    </div>
  );
}
