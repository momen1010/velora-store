// src/context/CartContext.jsx
import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from "react";
import { Check } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../firebase/config";
import { useCatalog } from "./CatalogContext";

/* ───────────── الثوابت ───────────── */
// قيم احتياطية فقط. القيم الفعلية تأتي من إعدادات المتجر في Firestore (storeSettings/main).
export const FREE_SHIPPING_THRESHOLD = 799;
export const SHIPPING_FEE = 50;
export const MAX_ITEM_QTY = 10;             // أقصى كمية للصنف الواحد
const CART_KEY = "velora_cart_v1";
const WISHLIST_KEY = "velora_wishlist_v1";
const TOAST_DURATION = 2600;

/* ───────────── أدوات مساعدة ───────────── */

// قراءة آمنة: لا تنهار لو المتصفح في وضع الخصوصية أو البيانات تالفة
const readStorage = (key, fallback) => {
  try {
    if (typeof window === "undefined") return fallback;
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    console.warn(`[Cart] تعذّرت قراءة ${key}:`, err);
    return fallback;
  }
};

// كتابة آمنة: تتجاهل الخطأ لو المساحة ممتلئة أو التخزين ممنوع
const writeStorage = (key, value) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[Cart] تعذّر حفظ ${key}:`, err);
  }
};

// تنظيف بيانات السلة المحفوظة: يستبعد أي عنصر تالف أو معدّل يدوياً
const sanitizeCart = (data) =>
  Array.isArray(data)
    ? data
        .filter(
          (i) =>
            i &&
            typeof i.cartItemId === "string" &&
            Number.isFinite(i.price) &&
            Number.isInteger(i.quantity) &&
            i.quantity > 0
        )
        .map((i) => ({ ...i, quantity: Math.min(i.quantity, MAX_ITEM_QTY) }))
    : [];

const sanitizeWishlist = (data) =>
  Array.isArray(data)
    ? [...new Set(data.filter((id) => typeof id === "number" || typeof id === "string"))]
    : [];

// المنتج + الدرجة = عنصر فريد في السلة
// المقاس (لو موجود) جزء من المعرّف عشان مقاسين مختلفين يبقوا سطرين منفصلين،
// وعشان يظهر في الطلب (cartItemId محفوظ في Firestore).
export const buildCartItemId = (productId, shade, size) => {
  const safeSize = size ? String(size).replace(/[^\w\u0600-\u06FF.-]/g, "").slice(0, 20) : "";
  return `${productId}__${shade?.name ?? "default"}${safeSize ? `__${safeSize}` : ""}`.slice(0, 100);
};

const round2 = (n) => Math.round(n * 100) / 100;

// نفس معادلة firestore.rules: النسبة أو المبلغ الثابت (بحد أقصى المجموع الفرعي)
export const computeDiscount = (promo, subtotal) => {
  if (!promo || subtotal <= 0 || subtotal < (promo.minOrder ?? 0)) return 0;
  const raw = promo.type === "percent" ? (subtotal * promo.value) / 100 : Math.min(promo.value, subtotal);
  return round2(raw);
};

/* ───────────── Context ───────────── */
const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => sanitizeCart(readStorage(CART_KEY, [])));
  const [wishlist, setWishlist] = useState(() => sanitizeWishlist(readStorage(WISHLIST_KEY, [])));
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [promo, setPromo] = useState(null);
  const { products: catalog, settings, source } = useCatalog();
  const feeSetting = Number(settings.shippingFee);
  const thresholdSetting = Number(settings.freeShippingThreshold);
  const toastTimer = useRef(null);

  /* ── الحفظ التلقائي ── */
  useEffect(() => writeStorage(CART_KEY, cart), [cart]);
  useEffect(() => writeStorage(WISHLIST_KEY, wishlist), [wishlist]);

  /* ── مزامنة التبويبات: لو غيّرت السلة في تبويب تتحدث الباقي ── */
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === CART_KEY) setCart(sanitizeCart(readStorage(CART_KEY, [])));
      if (e.key === WISHLIST_KEY) setWishlist(sanitizeWishlist(readStorage(WISHLIST_KEY, [])));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  /* ── مطابقة أسعار السلة مع الكتالوج الحالي (السعر الحقيقي من قاعدة البيانات) ── */
  useEffect(() => {
    if (source !== "firestore") return;
    setCart((prev) => {
      let changed = false;
      const next = prev.flatMap((i) => {
        const p = catalog.find((x) => String(x.id) === String(i.id));
        if (!p) { changed = true; return []; }
        if (p.price !== i.price || (p.oldPrice ?? null) !== (i.oldPrice ?? null)) {
          changed = true;
          return [{ ...i, price: p.price, oldPrice: p.oldPrice ?? null, name: p.name }];
        }
        return [i];
      });
      return changed ? next : prev;
    });
  }, [catalog, source]);

  /* ── Toast ── */
  const showToast = useCallback((message) => {
    setToast({ id: Date.now(), message });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), TOAST_DURATION);
  }, []);

  /* ── التحكم في الدرج ── */
  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  /* ── إجراءات السلة ── */
  const addToCart = useCallback(
    // الترتيب: (المنتج، الكمية، الدرجة، المقاس) وهو نفس ترتيب كل الاستدعاءات في الصفحات
    (product, quantity = 1, selectedShade = null, selectedSize = null) => {
      const qty = Number.isInteger(quantity) && quantity > 0 ? Math.min(quantity, MAX_ITEM_QTY) : 1;
      if (!product || product.id == null || !Number.isFinite(product.price)) {
        console.error("[Cart] addToCart: منتج غير صالح", product);
        return;
      }
      const cartItemId = buildCartItemId(product.id, selectedShade, selectedSize);

      setCart((prev) => {
        const existing = prev.find((i) => i.cartItemId === cartItemId);
        if (existing) {
          return prev.map((i) =>
            i.cartItemId === cartItemId
              ? { ...i, quantity: Math.min(i.quantity + qty, MAX_ITEM_QTY) }
              : i
          );
        }
        // نحفظ نسخة من بيانات المنتج وقت الإضافة (لا نعتمد على الكتالوج لاحقاً)
        return [
          ...prev,
          {
            cartItemId,
            id: product.id, // معرّف المنتج الأصلي (الكتالوج يعتمد عليه لعرض العدّاد)
            name: product.name,
            brand: product.brand,
            image: product.image,
            category: product.category,
            price: product.price,
            oldPrice: product.oldPrice ?? null,
            shade: selectedShade ? { name: selectedShade.name, hex: selectedShade.hex } : null,
            quantity: qty,
          },
        ];
      });

      showToast(`تمت إضافة ${product.name}${selectedShade ? ` (${selectedShade.name})` : ""} إلى السلة`);
      setIsCartOpen(true);
    },
    [showToast]
  );

  // delta = +1 أو -1، وعند الوصول إلى 0 يُحذف العنصر
  const updateQuantity = useCallback((cartItemId, delta) => {
    setCart((prev) =>
      prev.flatMap((i) => {
        if (i.cartItemId !== cartItemId) return [i];
        const next = i.quantity + delta;
        if (next <= 0) return [];
        return [{ ...i, quantity: Math.min(next, MAX_ITEM_QTY) }];
      })
    );
  }, []);

  const removeFromCart = useCallback(
    (cartItemId) => setCart((prev) => prev.filter((i) => i.cartItemId !== cartItemId)),
    []
  );

  const clearCart = useCallback(() => { setCart([]); setPromo(null); }, []);

  /* ── كود الخصم: نتحقق منه هنا للعرض، والقواعد في السيرفر تعيد التحقق عند إنشاء الطلب ── */
  const applyPromo = useCallback(async (rawCode) => {
    const code = String(rawCode ?? "").trim().toUpperCase();
    if (!/^[A-Z0-9_-]{3,30}$/.test(code)) return { ok: false, message: "كود الخصم غير صحيح" };
    if (!isFirebaseConfigured || !db) return { ok: false, message: "تعذّر التحقق من الكود الآن" };
    try {
      const snap = await getDoc(doc(db, "promotions", code));
      if (!snap.exists()) return { ok: false, message: "كود الخصم غير صحيح" };
      const d = snap.data();
      const expired = d.expiresAt && d.expiresAt.toMillis() < Date.now();
      if (d.active !== true || expired) return { ok: false, message: "كود الخصم منتهي" };
      if (d.startsAt && d.startsAt.toMillis() > Date.now()) {
        const when = d.startsAt.toDate().toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long" });
        return { ok: false, message: `هذا الكود يبدأ يوم ${when}` };
      }
      if (d.usageLimit > 0 && (d.usedCount ?? 0) >= d.usageLimit) return { ok: false, message: "تم استهلاك هذا الكود" };
      setPromo({ code, type: d.type, value: d.value, minOrder: d.minOrder ?? 0 });
      return { ok: true };
    } catch {
      return { ok: false, message: "كود الخصم غير صحيح" };
    }
  }, []);
  const removePromo = useCallback(() => setPromo(null), []);

  /* ── المفضلة ── */
  const toggleWishlist = useCallback(
    (productOrId) => {
      // بعض الصفحات تمرّر المنتج كاملاً وبعضها المعرّف؛ نخزّن المعرّف دائماً
      const productId = productOrId && typeof productOrId === "object" ? productOrId.id : productOrId;
      if (productId == null) return;
      setWishlist((prev) =>
        prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
      );
    },
    []
  );

  const isInWishlist = useCallback((productId) => wishlist.includes(productId), [wishlist]);

  /* ── الحسابات المالية ── */
  const totals = useMemo(() => {
    const subtotal = round2(cart.reduce((sum, i) => sum + i.price * i.quantity, 0));
    const cartCount = cart.reduce((n, i) => n + i.quantity, 0);
    const threshold = Number.isFinite(thresholdSetting) ? thresholdSetting : FREE_SHIPPING_THRESHOLD;
    const fee = Number.isFinite(feeSetting) ? feeSetting : SHIPPING_FEE;
    const shipping = cart.length === 0 || subtotal >= threshold ? 0 : fee;
    const discount = computeDiscount(promo, subtotal);
    return {
      subtotal,
      cartCount,
      shipping,
      discount,
      promoCode: discount > 0 ? promo.code : null,
      promoMinOrder: promo && subtotal < promo.minOrder ? promo.minOrder : null,
      total: round2(subtotal - discount + shipping),
      amountToFreeShipping: round2(Math.max(threshold - subtotal, 0)),
      shippingProgress: threshold > 0 ? Math.min((subtotal / threshold) * 100, 100) : 100,
    };
  }, [cart, promo, thresholdSetting, feeSetting]);

  const value = useMemo(
    () => ({
      cart, wishlist, isCartOpen,
      ...totals,
      openCart, closeCart,
      addToCart, updateQuantity, removeFromCart, clearCart,
      applyPromo, removePromo, promo,
      toggleWishlist, isInWishlist,
    }),
    [cart, wishlist, isCartOpen, totals, openCart, closeCart, addToCart,
     updateQuantity, removeFromCart, clearCart, applyPromo, removePromo, promo, toggleWishlist, isInWishlist]
  );

  return (
    <CartContext.Provider value={value}>
      {children}

      {/* حاوية Toast: موجودة دائماً ليقرأها قارئ الشاشة عند تغيّر محتواها */}
      <div
        role="status"
        aria-live="polite"
        dir="rtl"
        className="pointer-events-none fixed inset-x-0 top-4 z-[70] flex justify-center px-4"
      >
        {toast && (
          <div
            key={toast.id}
            className="flex max-w-sm items-center gap-2 rounded-full bg-stone-800 px-4 py-2.5 text-sm text-white shadow-lg"
          >
            <Check className="h-4 w-4 shrink-0 text-rose-300" aria-hidden="true" />
            <span className="truncate">{toast.message}</span>
          </div>
        )}
      </div>
    </CartContext.Provider>
  );
}

/* ───────────── Hook ───────────── */
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart يجب استخدامه داخل <CartProvider>");
  return ctx;
}