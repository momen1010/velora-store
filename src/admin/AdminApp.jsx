// نقطة دخول لوحة الأدمن (تُحمَّل lazy من App.jsx فلا تزيد حجم المتجر).
import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAdminAuth } from "./AuthContext";
import { DataProvider } from "./DataContext";
import { ToastProvider, Skeleton } from "./components/ui";
import Layout from "./Layout";
import Login from "./Login";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Orders = lazy(() => import("./pages/Orders"));
const Products = lazy(() => import("./pages/Products"));
const Categories = lazy(() => import("./pages/Categories"));
const Inventory = lazy(() => import("./pages/Inventory"));
const Customers = lazy(() => import("./pages/Customers"));
const Promotions = lazy(() => import("./pages/Promotions"));
const Settings = lazy(() => import("./pages/Settings"));

const Loading = () => <div className="space-y-4 p-2"><Skeleton className="h-8 w-48" /><Skeleton className="h-40" /><Skeleton className="h-64" /></div>;

function Guard({ area, children }) {
  const { can } = useAdminAuth();
  if (area && !can(area)) return <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">ليس لديك صلاحية لهذه الصفحة.</p>;
  return children;
}

function Protected() {
  const { loading, user, admin } = useAdminAuth();
  if (loading) return <div dir="rtl" className="p-8"><Loading /></div>;
  if (!user || !admin) return <Navigate to="/admin/login" replace />;
  return <DataProvider><Layout /></DataProvider>;
}

export default function AdminApp() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Suspense fallback={<div dir="rtl" className="p-8"><Loading /></div>}>
          <Routes>
            <Route path="login" element={<Login />} />
            <Route element={<Protected />}>
              <Route index element={<Dashboard />} />
              <Route path="orders" element={<Guard area="orders"><Orders /></Guard>} />
              <Route path="products" element={<Guard area="products"><Products /></Guard>} />
              <Route path="categories" element={<Guard area="categories"><Categories /></Guard>} />
              <Route path="inventory" element={<Guard area="inventory"><Inventory /></Guard>} />
              <Route path="customers" element={<Guard area="customers"><Customers /></Guard>} />
              <Route path="promotions" element={<Guard area="promotions"><Promotions /></Guard>} />
              <Route path="settings" element={<Guard area="settings"><Settings /></Guard>} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Route>
          </Routes>
        </Suspense>
      </ToastProvider>
    </AuthProvider>
  );
}
