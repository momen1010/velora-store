// src/context/CatalogContext.jsx
// المنتجات والإعدادات تُقرأ من Firestore. لو فشلت القراءة أو كانت فارغة نرجع للبيانات
// الثابتة (mockProducts) فلا ينكسر المتجر أبداً. آخر نسخة ناجحة تُحفظ محلياً لتفادي الوميض.
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../firebase/config";
import { mockProducts } from "../components/catalog/mockProducts";
import { docToStorefront } from "../data/productModel";

const CACHE_KEY = "velora_catalog_v1";

export const DEFAULT_SETTINGS = {
  storeName: "Velora",
  shippingFee: 50,
  freeShippingThreshold: 799,
  minOrderAmount: 0,
  paymentMethods: { cod: true, wallet: true },
};

const readCache = () => {
  try {
    const c = JSON.parse(window.localStorage.getItem(CACHE_KEY) || "null");
    if (c && Array.isArray(c.products) && c.products.length > 0) return c;
  } catch { /* تجاهل */ }
  return null;
};

const CatalogContext = createContext(null);

export function CatalogProvider({ children }) {
  const [cached] = useState(readCache);
  const [products, setProducts] = useState(cached?.products ?? mockProducts);
  const [settings, setSettings] = useState({ ...DEFAULT_SETTINGS, ...(cached?.settings ?? {}) });
  const [categories, setCategories] = useState(cached?.categories ?? null);
  const [source, setSource] = useState(cached ? "cache" : "static");

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const [pSnap, sSnap, cSnap] = await Promise.all([
          getDocs(query(collection(db, "products"), where("active", "==", true))),
          getDoc(doc(db, "storeSettings", "main")),
          getDocs(query(collection(db, "categories"), where("visible", "==", true))),
        ]);
        if (cancelled) return;
        const list = pSnap.docs.map((d) => docToStorefront(d.id, d.data())).sort((a, b) => a.sort - b.sort);
        const s = sSnap.exists() ? { ...DEFAULT_SETTINGS, ...sSnap.data() } : DEFAULT_SETTINGS;
        const cats = cSnap.docs.map((d) => ({ id: d.id, label: d.data().name, sort: d.data().sort ?? 0 })).sort((a, b) => a.sort - b.sort);
        if (list.length > 0) {
          setProducts(list);
          setSource("firestore");
          if (cats.length > 0) setCategories(cats);
          const clean = { ...s }; delete clean.updatedAt; delete clean.lastLogId;
          setSettings(clean);
          try {
            window.localStorage.setItem(CACHE_KEY, JSON.stringify({ products: list, settings: clean, categories: cats }));
          } catch { /* تجاهل */ }
        }
      } catch (err) {
        console.warn("[catalog] استخدام البيانات الاحتياطية:", err?.code ?? err?.message);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const value = useMemo(() => ({ products, settings, categories, source }), [products, settings, categories, source]);
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog يجب استخدامه داخل <CatalogProvider>");
  return ctx;
}

// رسوم الشحن وحد الشحن المجاني من إعدادات المتجر (مع قيم افتراضية)
export function useShipping() {
  const { settings } = useCatalog();
  return {
    SHIPPING_FEE: Number(settings.shippingFee),
    FREE_SHIPPING_THRESHOLD: Number(settings.freeShippingThreshold),
  };
}
