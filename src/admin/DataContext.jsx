// بيانات الأدمن اللحظية (onSnapshot): الطلبات (آخر 500)، المنتجات، الأقسام.
// المصدر الوحيد لكل صفحات اللوحة حتى لا تتكرر الاستعلامات.
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase/config";

const DataCtx = createContext(null);
export const ORDERS_LIMIT = 500;

function useLive(q, deps) {
  const [s, setS] = useState({ rows: [], loading: true, error: "" });
  useEffect(() => {
    setS((p) => ({ ...p, loading: true }));
    return onSnapshot(
      q(),
      (snap) => setS({ rows: snap.docs.map((d) => ({ id: d.id, ...d.data() })), loading: false, error: "" }),
      (err) => setS({ rows: [], loading: false, error: err.code === "permission-denied" ? "ليس لديك صلاحية لقراءة هذه البيانات." : "تعذّر تحميل البيانات." }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return s;
}

export function DataProvider({ children }) {
  const orders = useLive(() => query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(ORDERS_LIMIT)), []);
  const products = useLive(() => query(collection(db, "products")), []);
  const categories = useLive(() => query(collection(db, "categories")), []);
  const value = useMemo(() => ({ orders, products, categories }), [orders, products, categories]);
  return <DataCtx.Provider value={value}>{children}</DataCtx.Provider>;
}
// eslint-disable-next-line react-refresh/only-export-components
export const useAdminData = () => useContext(DataCtx);
