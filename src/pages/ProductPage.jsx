// src/pages/ProductPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Heart, ShoppingBag, ChevronLeft, Minus, Plus, Ruler, MessageCircle, Star } from "lucide-react";
import { SKIN_LABELS, formatPrice } from "../components/catalog/catalogConfig";
import SiteHeader from "../components/layout/SiteHeader";
import ProductCard from "../components/catalog/ProductCard";
import ProductGallery from "../components/product/ProductGallery";
import SizeGuide from "../components/product/SizeGuide";
import InfoStrip from "../components/product/InfoStrip";
import { useCatalog, useShipping } from "../context/CatalogContext";
import useDocumentTitle from "../utils/useDocumentTitle";
import { useCart } from "../context/CartContext";
import { whatsappLink } from "../utils/whatsapp";

const CAT_LABEL = { bags: "الشنط", shoes: "الأحذية", makeup: "المكياج", skincare: "العناية بالبشرة" };
const MAX_QTY = 10;

function Accordion({ title, children, open = false }) {
  return (
    <details className="group border-b border-[#F3DDE3] py-4" open={open}>
      <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-[#4A2C3A] [&::-webkit-details-marker]:hidden">
        <span>{title}</span>
        <ChevronLeft className="h-5 w-5 -rotate-90 transition group-open:rotate-90" />
      </summary>
      <div className="mt-3 text-sm leading-relaxed text-gray-600">{children}</div>
    </details>
  );
}

export default function ProductPage() {
  const { id } = useParams();
  const { addToCart, wishlist = [], toggleWishlist, cart = [] } = useCart();
  const navigate = useNavigate();
  const { products } = useCatalog();
  const { SHIPPING_FEE, FREE_SHIPPING_THRESHOLD } = useShipping();
  const product = products.find((p) => String(p.id) === String(id));

  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(null);
  const [shadeIdx, setShadeIdx] = useState(0);
  const [sizeError, setSizeError] = useState(false);
  const [guide, setGuide] = useState(false);
  const [ctaVisible, setCtaVisible] = useState(true);
  const ctaRef = useRef(null);
  const sizeRef = useRef(null);
  useDocumentTitle(product ? `${product.name} | Velora` : "المنتج غير موجود | Velora");

  useEffect(() => { setQuantity(1); setSelectedSize(null); setShadeIdx(0); setSizeError(false); }, [id]);

  useEffect(() => {
    const el = ctaRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver(([e]) => setCtaVisible(e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [product?.id]);

  const related = useMemo(() => {
    if (!product) return [];
    const same = products.filter((p) => p.category === product.category && p.id !== product.id);
    const rest = products.filter((p) => p.category !== product.category && p.id !== product.id);
    return [...same, ...rest].slice(0, 4);
  }, [products, product]);

  if (!product) {
    return (
      <div dir="rtl" className="font-['Tajawal',system-ui,sans-serif]">
        <SiteHeader />
        <div className="flex min-h-[50vh] flex-col items-center justify-center">
          <h2 className="text-2xl font-bold text-gray-800">المنتج غير موجود</h2>
          <Link to="/shop" className="mt-4 text-[#C2557A] hover:underline">العودة للمتجر</Link>
        </div>
      </div>
    );
  }

  const isGoods = product.category === "bags" || product.category === "shoes";
  const isShoes = product.category === "shoes";
  const hasSizes = product.sizes?.length > 0;
  const shades = product.shades ?? [];
  const isWishlisted = Array.isArray(wishlist) && (wishlist.includes(product.id) || wishlist.some((w) => w?.id === product.id));
  const soldOut = product.trackStock && product.stock <= 0;
  const lowStock = product.trackStock && product.stock > 0 && product.stock <= 5;
  const maxQty = product.trackStock ? Math.max(1, Math.min(MAX_QTY, product.stock)) : MAX_QTY;
  const images = (product.images?.length ? product.images : [product.image]).filter(Boolean);
  const inCart = cart.filter((i) => String(i.id ?? i.productId) === String(product.id)).reduce((s, i) => s + (i.quantity || 0), 0);

  const handleAddToCart = () => {
    if (soldOut) return;
    if (hasSizes && !selectedSize) {
      setSizeError(true);
      sizeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    addToCart(product, quantity, shades.length ? shades[shadeIdx] : null, selectedSize);
  };

  const waText = `مرحباً، عندي سؤال عن المنتج: ${product.name}\n${typeof window !== "undefined" ? window.location.href : ""}`;
  const wa = whatsappLink(waText);

  return (
    <div dir="rtl" className="min-h-screen bg-[#FFF9FA] font-['Tajawal',system-ui,sans-serif] text-[#4A2C3A]">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 pb-28 pt-6 md:pb-12 md:pt-8 lg:px-10">
        <nav aria-label="مسار التصفح" className="mb-6 flex flex-wrap items-center gap-2 text-sm text-gray-500">
          <Link to="/" className="hover:text-[#C2557A]">الرئيسية</Link>
          <ChevronLeft className="h-4 w-4" />
          <Link to={`/shop?category=${product.category}`} className="hover:text-[#C2557A]">{CAT_LABEL[product.category] ?? "المتجر"}</Link>
          <ChevronLeft className="h-4 w-4" />
          <span className="font-semibold text-gray-800">{product.name}</span>
        </nav>

        <div className="grid gap-8 md:grid-cols-2 md:gap-12">
          <ProductGallery images={images} alt={product.name} badge={product.badge} discount={product.discount} />

          <div className="flex flex-col">
            {product.brand && <p className="text-sm font-medium tracking-wide text-[#C2557A]">{product.brand}</p>}
            <h1 className="mt-1 text-2xl font-bold leading-snug text-[#4A2C3A] md:text-3xl">{product.name}</h1>
            {product.nameEn && <p dir="ltr" className="mt-1 text-start text-sm text-gray-400">{product.nameEn}</p>}

            <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold text-gray-700">{product.rating}</span>
            </div>

            <div className="mt-4 flex flex-wrap items-baseline gap-3">
              <span className="text-3xl font-bold text-[#C2557A]">{formatPrice(product.price)}</span>
              {product.oldPrice && <span className="text-lg text-gray-400 line-through">{formatPrice(product.oldPrice)}</span>}
              {product.discount ? <span className="rounded-full bg-[#FCE7EC] px-2.5 py-0.5 text-xs font-bold text-[#C2557A]">وفّري {formatPrice(product.oldPrice - product.price)}</span> : null}
            </div>

            {soldOut ? (
              <p className="mt-3 text-sm font-semibold text-red-600">نفدت الكمية حالياً</p>
            ) : lowStock ? (
              <p className="mt-3 text-sm font-semibold text-amber-700">باقي {product.stock} قطع فقط</p>
            ) : (
              <p className="mt-3 text-sm font-medium text-emerald-700">متوفر</p>
            )}

            {product.skinType?.length > 0 && !isGoods && (
              <p className="mt-2 text-sm text-gray-500">
                مناسب لـ: {product.skinType.includes("all") ? "جميع الأنواع" : product.skinType.map((t) => SKIN_LABELS[t] ?? t).join("، ")}
              </p>
            )}

            {shades.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-3 text-sm font-semibold">الدرجة: <span className="font-normal text-gray-600">{shades[shadeIdx]?.name}</span></h3>
                <div role="radiogroup" aria-label="الدرجة" className="flex flex-wrap gap-2.5">
                  {shades.map((s, i) => (
                    <button key={s.name} type="button" role="radio" aria-checked={i === shadeIdx} aria-label={s.name} title={s.name} onClick={() => setShadeIdx(i)}
                      className="rounded-full p-1 outline-none focus-visible:ring-2 focus-visible:ring-[#C2557A]">
                      <span className={`block h-8 w-8 rounded-full border border-black/10 ${i === shadeIdx ? "ring-2 ring-[#C2557A] ring-offset-2" : ""}`} style={{ backgroundColor: s.hex }} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {hasSizes && (
              <div ref={sizeRef} className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">اختاري المقاس{selectedSize ? `: ${selectedSize}` : ""}</h3>
                  {isShoes && (
                    <button type="button" onClick={() => setGuide(true)} className="flex items-center gap-1 text-sm font-semibold text-[#C2557A] hover:underline">
                      <Ruler className="h-4 w-4" />دليل المقاسات
                    </button>
                  )}
                </div>
                <div role="radiogroup" aria-label="المقاس" className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button key={size} type="button" role="radio" aria-checked={selectedSize === size} onClick={() => { setSelectedSize(size); setSizeError(false); }}
                      className={`min-w-[3.25rem] rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                        selectedSize === size ? "border-[#4A2C3A] bg-[#4A2C3A] text-white" : sizeError ? "border-red-400 bg-white text-gray-700" : "border-gray-300 bg-white text-gray-700 hover:border-[#4A2C3A]"
                      }`}>
                      {size}
                    </button>
                  ))}
                </div>
                {sizeError && <p role="alert" className="mt-2 text-sm font-medium text-red-600">من فضلك اختاري المقاس الأول.</p>}
              </div>
            )}

            <div ref={ctaRef} className="mt-7 flex items-center gap-3">
              <div className="flex items-center rounded-full border border-gray-300 bg-white">
                <button type="button" aria-label="تقليل الكمية" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="p-3 hover:text-[#C2557A]"><Minus className="h-4 w-4" /></button>
                <span className="w-7 text-center font-medium" aria-live="polite">{quantity}</span>
                <button type="button" aria-label="زيادة الكمية" onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))} className="p-3 hover:text-[#C2557A]"><Plus className="h-4 w-4" /></button>
              </div>
              <button type="button" onClick={handleAddToCart} disabled={soldOut}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#4A2C3A] py-3.5 font-semibold text-white shadow-lg shadow-[#4A2C3A]/20 transition hover:bg-[#C2557A] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none">
                <ShoppingBag className="h-5 w-5" />
                {soldOut ? "نفدت الكمية" : "أضيفي إلى السلة"}
              </button>
              <button type="button" onClick={() => toggleWishlist(product)} aria-label={isWishlisted ? "إزالة من المفضلة" : "إضافة للمفضلة"} aria-pressed={isWishlisted}
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border transition ${isWishlisted ? "border-[#C2557A] bg-pink-50 text-[#C2557A]" : "border-gray-300 bg-white text-gray-500 hover:border-[#C2557A]"}`}>
                <Heart className={`h-5 w-5 ${isWishlisted ? "fill-[#C2557A]" : ""}`} />
              </button>
            </div>
            {inCart > 0 && <p className="mt-2 text-xs text-gray-500">في سلتك {inCart} من هذا المنتج.</p>}

            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 self-start text-sm font-medium text-gray-600 hover:text-[#C2557A]">
                <MessageCircle className="h-4 w-4" />عندك سؤال عن المنتج؟ كلمينا على واتساب
              </a>
            )}

            <InfoStrip shippingFee={SHIPPING_FEE} freeThreshold={FREE_SHIPPING_THRESHOLD} />

            <div className="mt-8 border-t border-[#F3DDE3]">
              <Accordion title="الوصف" open>{product.description || "لا يوجد وصف متاح لهذا المنتج."}</Accordion>
              <Accordion title={isGoods ? "الخامات والتفاصيل" : "المكونات"}>
                <span dir="auto">{product.ingredients || (isGoods ? "لا توجد تفاصيل مسجلة." : "لا توجد مكونات مسجلة.")}</span>
              </Accordion>
              <Accordion title={isGoods ? "العناية بالمنتج" : "طريقة الاستخدام"}>{product.usage || "لم يتم إضافة طريقة استخدام."}</Accordion>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section aria-labelledby="related-h" className="mt-16">
            <div className="mb-6 flex items-end justify-between">
              <h2 id="related-h" className="text-2xl font-bold text-[#4A2C3A]">قد يعجبك أيضاً</h2>
              <Link to={`/shop?category=${product.category}`} className="text-sm font-semibold text-[#C2557A] hover:underline">عرض الكل ←</Link>
            </div>
            <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
              {related.map((r) => (
                <div key={r.id} className="w-[44vw] shrink-0 snap-start sm:w-[30vw] md:w-auto">
                  <ProductCard product={r} cartQty={0}
                    isWishlisted={Array.isArray(wishlist) && (wishlist.includes(r.id) || wishlist.some((w) => w?.id === r.id))}
                    onAddToCart={addToCart} onToggleWishlist={toggleWishlist} onOpen={(x) => navigate(`/product/${x.id}`)} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* شريط إضافة للسلة ثابت على الموبايل */}
      <div className={`fixed inset-x-0 bottom-0 z-40 border-t border-[#F3DDE3] bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(74,44,58,0.08)] backdrop-blur transition-transform duration-300 md:hidden ${ctaVisible ? "translate-y-full" : "translate-y-0"}`}
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }} aria-hidden={ctaVisible}>
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs text-gray-500">{product.name}</p>
            <p className="text-lg font-bold text-[#C2557A]">{formatPrice(product.price)}</p>
          </div>
          <button type="button" tabIndex={ctaVisible ? -1 : 0} onClick={handleAddToCart} disabled={soldOut}
            className="ms-auto flex flex-1 items-center justify-center gap-2 rounded-full bg-[#4A2C3A] py-3 font-semibold text-white disabled:bg-gray-300">
            <ShoppingBag className="h-5 w-5" />{soldOut ? "نفدت الكمية" : hasSizes && !selectedSize ? "اختاري المقاس" : "أضيفي إلى السلة"}
          </button>
        </div>
      </div>

      <SizeGuide open={guide} onClose={() => setGuide(false)} available={product.sizes ?? []} />
    </div>
  );
}
