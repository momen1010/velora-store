// src/components/cart/CartDrawer.jsx
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Minus, Plus, ShoppingBag, Sparkles, Trash2, X } from "lucide-react";
import { MAX_ITEM_QTY, useCart } from "../../context/CartContext";
import { useShipping } from "../../context/CatalogContext";
import { formatPrice } from "../catalog/catalogConfig";

/* ───────────── زر السلة (للهيدر) ───────────── */
export function CartButton({ className = "" }) {
  const { cartCount, openCart } = useCart();
  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={cartCount ? `السلة، ${cartCount} منتج` : "السلة"}
      className={`relative flex h-11 w-11 items-center justify-center rounded-full border border-rose-100 bg-white text-stone-800 outline-none transition-colors hover:border-rose-500 focus-visible:ring-2 focus-visible:ring-rose-500 ${className}`}
    >
      <ShoppingBag className="h-5 w-5" aria-hidden="true" />
      {cartCount > 0 && (
        <span className="absolute -end-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-xs font-bold text-white">
          {cartCount}
        </span>
      )}
    </button>
  );
}

/* ───────────── شريط الشحن المجاني ───────────── */
function FreeShippingBar({ subtotal, progress, remaining }) {
  const { FREE_SHIPPING_THRESHOLD } = useShipping();
  const unlocked = subtotal >= FREE_SHIPPING_THRESHOLD;
  return (
    <div className="mx-5 mt-4 rounded-2xl bg-rose-50 p-4">
      <p className="flex items-center gap-2 text-sm font-medium text-stone-800">
        <Sparkles className="h-4 w-4 shrink-0 text-rose-500" aria-hidden="true" />
        {unlocked ? (
          "مبروك! طلبك يحصل على شحن مجاني"
        ) : (
          <span>
            أضف منتجات بقيمة <b className="text-rose-600">{formatPrice(remaining)}</b> لتحصل على شحن مجاني
          </span>
        )}
      </p>
      <div
        role="progressbar"
        aria-label="التقدم نحو الشحن المجاني"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
        className="mt-3 h-2 overflow-hidden rounded-full bg-rose-100"
      >
        <div
          className="h-full rounded-full bg-rose-500 transition-[width] duration-500 motion-reduce:transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

/* ───────────── صف منتج في السلة ───────────── */
function CartItemRow({ item, onChangeQty, onRemove }) {
  const [imgFailed, setImgFailed] = useState(false);
  const atMax = item.quantity >= MAX_ITEM_QTY;
  const stepBtn =
    "flex h-8 w-8 items-center justify-center rounded-full text-stone-800 outline-none transition-colors hover:bg-rose-50 focus-visible:ring-2 focus-visible:ring-rose-500 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <li className="flex gap-3 rounded-2xl border border-rose-100 bg-white p-3">
      <div className="h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-rose-100">
        {item.image && !imgFailed ? (
          <img
            src={item.image}
            alt={`${item.brand} ${item.name}`}
            loading="lazy"
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ background: `linear-gradient(160deg, #FFF1F4, ${item.shade?.hex ?? "#F7CFD9"})` }}
          >
            <Sparkles className="h-5 w-5 text-white/80" aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-stone-500">{item.brand}</p>
            <h3 className="line-clamp-2 text-sm font-medium leading-5 text-stone-800">{item.name}</h3>
          </div>
          <button
            type="button"
            onClick={() => onRemove(item.cartItemId)}
            aria-label={`حذف ${item.name} من السلة`}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-stone-500 outline-none transition-colors hover:bg-rose-50 hover:text-rose-600 focus-visible:ring-2 focus-visible:ring-rose-500"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {item.shade && (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-stone-500">
            <span
              className="h-3 w-3 rounded-full border border-black/10"
              style={{ backgroundColor: item.shade.hex }}
              aria-hidden="true"
            />
            الدرجة: {item.shade.name}
          </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div className="flex items-center rounded-full border border-rose-100 bg-[#FFF9FA]" role="group" aria-label="الكمية">
            <button type="button" className={stepBtn} onClick={() => onChangeQty(item.cartItemId, -1)} aria-label="تقليل الكمية">
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-6 text-center text-sm font-medium text-stone-800" aria-live="polite">
              {item.quantity}
            </span>
            <button
              type="button"
              className={stepBtn}
              onClick={() => onChangeQty(item.cartItemId, 1)}
              disabled={atMax}
              aria-label="زيادة الكمية"
              title={atMax ? `الحد الأقصى ${MAX_ITEM_QTY}` : undefined}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="text-end">
            <p className="text-sm font-bold text-rose-600">{formatPrice(item.price * item.quantity)}</p>
            {item.oldPrice && item.oldPrice > item.price && (
              <p className="text-xs text-stone-500 line-through">{formatPrice(item.oldPrice * item.quantity)}</p>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

/* ───────────── الدرج الرئيسي ───────────── */
/**
 * Props اختيارية:
 *  - onCheckout({ cart, subtotal, shipping, total })  ← تُستدعى عند الضغط على إتمام الشراء
 *  - onContinueShopping()                              ← تُستدعى من زر الحالة الفارغة
 */
export default function CartDrawer({ onCheckout, onContinueShopping }) {
  const {
    cart, isCartOpen, closeCart, updateQuantity, removeFromCart,
    subtotal, shipping, total, shippingProgress, amountToFreeShipping,
  } = useCart();
  const closeBtnRef = useRef(null);
  const isEmpty = cart.length === 0;

  // Escape للإغلاق + منع تمرير الصفحة خلف الدرج + تركيز زر الإغلاق عند الفتح
  useEffect(() => {
    if (!isCartOpen) return;
    const onKey = (e) => e.key === "Escape" && closeCart();
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isCartOpen, closeCart]);

  const handleCheckout = () => {
    if (onCheckout) onCheckout({ cart, subtotal, shipping, total });
    else console.info("[Cart] checkout", { cart, subtotal, shipping, total }); // سيربطها الأجينت التالي
  };

  const handleContinue = () => {
    closeCart();
    onContinueShopping?.();
  };

  return (
    <div
      dir="rtl"
      aria-hidden={!isCartOpen}
      inert={!isCartOpen}
      className={`fixed inset-0 z-50 transition-[visibility] duration-300 ${isCartOpen ? "visible" : "invisible"}`}
    >
      {/* الخلفية الشفافة مع blur */}
      <div
        onClick={closeCart}
        className={`absolute inset-0 bg-stone-900/30 backdrop-blur-sm transition-opacity duration-300 motion-reduce:transition-none ${
          isCartOpen ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* اللوحة: تنزلق من اليسار */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="سلة التسوق"
        className={`absolute left-0 top-0 flex h-full w-full max-w-md flex-col bg-[#FFF9FA] shadow-2xl transition-transform duration-300 ease-out motion-reduce:transition-none ${
          isCartOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* الرأس */}
        <header className="flex items-center justify-between border-b border-rose-100 px-5 py-4">
          <h2 className="flex items-center gap-2 text-lg font-bold text-stone-800">
            <ShoppingBag className="h-5 w-5 text-rose-500" aria-hidden="true" />
            سلة التسوق
          </h2>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={closeCart}
            aria-label="إغلاق السلة"
            className="flex h-9 w-9 items-center justify-center rounded-full text-stone-800 outline-none transition-colors hover:bg-rose-50 focus-visible:ring-2 focus-visible:ring-rose-500"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {isEmpty ? (
          /* الحالة الفارغة */
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-50">
              <ShoppingBag className="h-9 w-9 text-rose-500" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-bold text-stone-800">سلتك فارغة</h3>
            <p className="max-w-xs text-sm leading-6 text-stone-500">
              لم تضف أي منتج بعد. ابدأ بتصفح منتجات العناية والمكياج واختر ما يناسبك.
            </p>
            <button
              type="button"
              onClick={handleContinue}
              className="mt-2 h-12 rounded-full bg-stone-800 px-8 text-sm font-bold text-white outline-none transition-colors hover:bg-rose-600 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
            >
              تصفّح المنتجات
            </button>
          </div>
        ) : (
          <>
            <FreeShippingBar subtotal={subtotal} progress={shippingProgress} remaining={amountToFreeShipping} />

            <ul className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {cart.map((item) => (
                <CartItemRow
                  key={item.cartItemId}
                  item={item}
                  onChangeQty={updateQuantity}
                  onRemove={removeFromCart}
                />
              ))}
            </ul>

            {/* تذييل الدفع */}
            <footer className="border-t border-rose-100 bg-white px-5 pb-5 pt-4">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between text-stone-500">
                  <dt>المجموع الفرعي</dt>
                  <dd className="text-stone-800">{formatPrice(subtotal)}</dd>
                </div>
                <div className="flex justify-between text-stone-500">
                  <dt>الشحن</dt>
                  <dd className={shipping === 0 ? "font-medium text-rose-600" : "text-stone-800"}>
                    {shipping === 0 ? "مجاني" : formatPrice(shipping)}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-rose-100 pt-3 text-base font-bold text-stone-800">
                  <dt>الإجمالي</dt>
                  <dd>{formatPrice(total)}</dd>
                </div>
              </dl>

              <button
                type="button"
                onClick={handleCheckout}
                className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-rose-600 text-sm font-bold text-white outline-none transition-colors hover:bg-rose-700 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
              >
                إتمام الشراء بأمان
                {/* في RTL الاتجاه الأمامي لليسار */}
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={handleContinue}
                className="mt-2 h-10 w-full text-sm font-medium text-stone-500 outline-none hover:text-rose-600 focus-visible:ring-2 focus-visible:ring-rose-500"
              >
                متابعة التسوق
              </button>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}