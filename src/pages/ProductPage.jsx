// src/pages/ProductPage.jsx  →  المسار: /product/:id
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronDown, ChevronLeft, Heart, Minus, Plus, ShieldCheck, ShoppingBag, Sparkles, Star, Truck } from "lucide-react";
import PageShell from "../components/layout/PageShell";
import ProductGrid from "../components/catalog/ProductGrid";
import { mockProducts } from "../components/catalog/mockProducts";
import { SAMPLE_REVIEWS, getProductDetails } from "../components/catalog/productDetails";
import { CATEGORIES, SKIN_LABELS, formatPrice, getDiscount } from "../components/catalog/catalogConfig";
import { FREE_SHIPPING_THRESHOLD, MAX_ITEM_QTY, useCart } from "../context/CartContext";

function Stars({ value, size = "h-4 w-4" }) {
  return (
    <span className="flex items-center gap-0.5" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`${size} ${n <= Math.round(value) ? "fill-[#E9A23B] text-[#E9A23B]" : "text-[#E8CFD6]"}`} />
      ))}
    </span>
  );
}

// قسم قابل للطي (details أصلي = يعمل بالكيبورد وقارئ الشاشة بدون كود إضافي)
function Section({ title, defaultOpen = false, children }) {
  return (
    <details open={defaultOpen} className="group border-b border-[#F3D5DD] py-4">
      <summary className="flex cursor-pointer list-none items-center justify-between text-base font-bold text-[#4A2C3A] outline-none focus-visible:ring-2 focus-visible:ring-[#C2557A] [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown className="h-5 w-5 text-[#8C6F7B] transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
      </summary>
      <div className="pt-3 text-sm leading-7 text-[#4A2C3A]">{children}</div>
    </details>
  );
}

function ProductView({ product }) {
  const navigate = useNavigate();
  const { cart, wishlist, addToCart, toggleWishlist } = useCart();
  const [shadeIdx, setShadeIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [imgFailed, setImgFailed] = useState(false);

  const { name, brand, price, oldPrice, rating, reviews, badge, image, shades = [] } = product;
  const shade = shades[shadeIdx] ?? null;
  const discount = getDiscount(product);
  const details = getProductDetails(product);
  const inWishlist = wishlist.includes(product.id);
  const categoryLabel = CATEGORIES.find((c) => c.id === product.category)?.label;
  const skinText = product.skinType?.includes("all")
    ? "جميع أنواع البشرة"
    : product.skinType?.map((t) => SKIN_LABELS[t] ?? t).join("، ");

  useEffect(() => {
    document.title = `${name} | velora`;
  }, [name]);

  const wishSet = useMemo(() => new Set(wishlist), [wishlist]);
  const related = useMemo(
    () => mockProducts.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4),
    [product]
  );

  const stepBtn =
    "flex h-11 w-11 items-center justify-center rounded-full text-[#4A2C3A] outline-none transition-colors hover:bg-[#FBE4EA] focus-visible:ring-2 focus-visible:ring-[#C2557A] disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <>
      {/* مسار التنقل: في RTL السهم لليسار يعني "التالي" */}
      <nav aria-label="مسار التنقل" className="mb-5 flex flex-wrap items-center gap-1 text-sm text-[#8C6F7B]">
        <Link to="/" className="hover:text-[#C2557A]">الرئيسية</Link>
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        <span>{categoryLabel}</span>
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        <span className="line-clamp-1 text-[#4A2C3A]" aria-current="page">{name}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-2 lg:gap-14">
        {/* الصورة الكبيرة: عند غياب الصورة يظهر تدرج بلون الدرجة المختارة */}
        <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-[#FBE4EA]">
          {image && !imgFailed ? (
            <img src={image} alt={`${brand} ${name}`} onError={() => setImgFailed(true)} className="h-full w-full object-cover" />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center transition-colors duration-300"
              style={{ background: `linear-gradient(160deg, #FFF1F4 0%, ${shade?.hex ?? "#F7CFD9"} 100%)` }}
            >
              <Sparkles className="h-14 w-14 text-white/80" aria-hidden="true" />
            </div>
          )}
          {discount ? (
            <span className="absolute start-4 top-4 rounded-full bg-[#C2557A] px-3 py-1 text-sm font-bold text-white">-{discount}%</span>
          ) : null}
          {badge && (
            <span className="absolute bottom-4 start-4 rounded-full bg-white/90 px-3 py-1 text-sm font-medium text-[#4A2C3A]">{badge}</span>
          )}
        </div>

        {/* معلومات المنتج */}
        <div className="flex flex-col">
          <p className="text-sm text-[#8C6F7B]">{brand}</p>
          <h1 className="mt-1 text-2xl font-bold leading-9 md:text-3xl">{name}</h1>

          <a href="#reviews" className="mt-3 flex items-center gap-2 text-sm text-[#8C6F7B] hover:text-[#C2557A]">
            <Stars value={rating} />
            <span className="font-medium text-[#4A2C3A]">{rating.toFixed(1)}</span>
            <span>({reviews.toLocaleString("ar-EG")} تقييم)</span>
          </a>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-[#C2557A]">{formatPrice(price)}</span>
            {oldPrice && oldPrice > price && <span className="text-base text-[#8C6F7B] line-through">{formatPrice(oldPrice)}</span>}
          </div>

          {skinText && <p className="mt-3 text-sm text-[#8C6F7B]">مناسب لبشرة: <span className="text-[#4A2C3A]">{skinText}</span></p>}

          {/* اختيار الدرجة */}
          {shades.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-sm font-bold">الدرجة: <span className="font-normal text-[#4A2C3A]">{shade?.name}</span></p>
              <div role="radiogroup" aria-label="درجات اللون" className="flex flex-wrap gap-2">
                {shades.map((s, i) => (
                  <button
                    key={`${s.name}-${s.hex}`}
                    type="button"
                    role="radio"
                    aria-checked={i === shadeIdx}
                    aria-label={s.name}
                    title={s.name}
                    onClick={() => setShadeIdx(i)}
                    className="rounded-full p-1 outline-none focus-visible:ring-2 focus-visible:ring-[#C2557A]"
                  >
                    <span
                      className={`block h-9 w-9 rounded-full border border-black/10 ${i === shadeIdx ? "ring-2 ring-[#C2557A] ring-offset-2 ring-offset-[#FFF9FA]" : ""}`}
                      style={{ backgroundColor: s.hex }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* الكمية + الإضافة */}
          <div className="mt-6 flex items-center gap-3">
            <div role="group" aria-label="الكمية" className="flex items-center rounded-full border border-[#F3D5DD] bg-white">
              <button type="button" className={stepBtn} onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="تقليل الكمية">
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-8 text-center font-medium" aria-live="polite">{qty}</span>
              <button type="button" className={stepBtn} onClick={() => setQty((q) => Math.min(MAX_ITEM_QTY, q + 1))} disabled={qty >= MAX_ITEM_QTY} aria-label="زيادة الكمية">
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => addToCart(product, shade, qty)}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#4A2C3A] text-base font-bold text-white outline-none transition-colors hover:bg-[#C2557A] focus-visible:ring-2 focus-visible:ring-[#C2557A] focus-visible:ring-offset-2"
            >
              <ShoppingBag className="h-5 w-5" aria-hidden="true" />
              أضف إلى السلة
            </button>

            <button
              type="button"
              onClick={() => toggleWishlist(product.id)}
              aria-pressed={inWishlist}
              aria-label={inWishlist ? "أزل من المفضلة" : "أضف إلى المفضلة"}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#F3D5DD] bg-white outline-none transition-colors hover:border-[#C2557A] focus-visible:ring-2 focus-visible:ring-[#C2557A]"
            >
              <Heart className={`h-5 w-5 ${inWishlist ? "fill-[#C2557A] text-[#C2557A]" : ""}`} />
            </button>
          </div>

          <ul className="mt-5 space-y-2 text-sm text-[#8C6F7B]">
            <li className="flex items-center gap-2"><Truck className="h-4 w-4 text-[#C2557A]" aria-hidden="true" />شحن مجاني للطلبات فوق {formatPrice(FREE_SHIPPING_THRESHOLD)}</li>
            <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#C2557A]" aria-hidden="true" />الدفع عند الاستلام</li>
          </ul>

          <div className="mt-6 border-t border-[#F3D5DD]">
            <Section title="الوصف" defaultOpen><p>{details.description}</p></Section>
            <Section title="المكونات"><p dir="ltr" className="text-start text-[#4A2C3A]">{details.ingredients}</p></Section>
            <Section title="طريقة الاستخدام"><p>{details.howToUse}</p></Section>
          </div>
        </div>
      </div>

      {/* التقييمات */}
      <section id="reviews" aria-labelledby="reviews-title" className="mt-14 scroll-mt-24">
        <h2 id="reviews-title" className="text-xl font-bold">التقييمات</h2>
        <div className="mt-4 flex flex-col gap-6 md:flex-row md:gap-12">
          <div className="flex shrink-0 items-center gap-4 md:flex-col md:items-start">
            <p className="text-5xl font-bold">{rating.toFixed(1)}</p>
            <div className="flex flex-col gap-1">
              <Stars value={rating} size="h-5 w-5" />
              <p className="text-sm text-[#8C6F7B]">{reviews.toLocaleString("ar-EG")} تقييم</p>
            </div>
          </div>
          <ul className="flex-1 divide-y divide-[#F3D5DD]">
            {SAMPLE_REVIEWS.map((r) => (
              <li key={r.id} className="py-4 first:pt-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Stars value={r.rating} />
                    <span className="text-sm font-medium">{r.author}</span>
                  </div>
                  <span className="text-xs text-[#8C6F7B]">{r.date}</span>
                </div>
                <p className="mt-2 text-sm leading-7">{r.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="mt-14">
          <h2 id="related-title" className="mb-5 text-xl font-bold">قد يعجبك أيضاً</h2>
          <ProductGrid
            products={related}
            cartItems={cart}
            wishlistIds={wishSet}
            onAddToCart={addToCart}
            onToggleWishlist={toggleWishlist}
            onOpenProduct={(p) => navigate(`/product/${p.id}`)}
          />
        </section>
      )}
    </>
  );
}

export default function ProductPage() {
  const { id } = useParams();
  const product = useMemo(() => mockProducts.find((p) => String(p.id) === id), [id]);

  if (!product) {
    return (
      <PageShell>
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <h1 className="text-2xl font-bold">المنتج غير موجود</h1>
          <p className="text-[#8C6F7B]">ربما تم حذف المنتج أو أن الرابط غير صحيح.</p>
          <Link to="/" className="flex h-12 items-center rounded-full bg-[#4A2C3A] px-8 text-sm font-bold text-white hover:bg-[#C2557A]">
            العودة للمنتجات
          </Link>
        </div>
      </PageShell>
    );
  }

  // key: عند الانتقال لمنتج آخر (من "قد يعجبك") تُصفَّر الحالة (الدرجة والكمية)
  return (
    <PageShell>
      <ProductView key={product.id} product={product} />
    </PageShell>
  );
}
