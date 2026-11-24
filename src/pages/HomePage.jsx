import { Link, useNavigate } from "react-router-dom";
import { Truck, Banknote, RotateCcw, Headset, ArrowLeft, Sparkles, MessageCircle } from "lucide-react";

// ─── Cart (الموجود في مشروعك) ─────────────────────────────
import { useCart, FREE_SHIPPING_THRESHOLD } from "../context/CartContext";
import useDocumentTitle from "../utils/useDocumentTitle";

// ─── Layout + Catalog ─────────────────────────────────────
import SiteHeader from "../components/layout/SiteHeader";
import { WHATSAPP_NUMBER, RETURN_DAYS } from "../config/store";
import ProductCard from "../components/catalog/ProductCard";
import { mockProducts } from "../components/catalog/mockProducts";
import { formatPrice } from "../components/catalog/catalogConfig";

/* ═══════════════════════════════════════════════════════════
   ثابت الشحن المجاني (كان مفقوداً)
   ═══════════════════════════════════════════════════════════ */
// الحد الأدنى للشحن المجاني يُقرأ من CartContext (٧٩٩ ج.م) عشان يبقى رقم واحد في كل الموقع

/* ═══════════════════════════════════════════════════════════
   🎯 خريطة الروابط — مصدر واحد للحقيقة
   كل رابط هنا مضمون أنه يذهب للصفحة/الفلتر الصحيح
   ═══════════════════════════════════════════════════════════ */
const ROUTES = {
  home: "/",
  shop: "/shop",
  bestSellers: "/shop?filter=best-sellers",
  skincare: "/shop?category=skincare",
  makeup: "/shop?category=makeup",

  offers: "/shop?filter=offers",
  search: "/shop?focus=search",
};

/* ═══════════════════════════════════════════════════════════
   بيانات بطاقات الفئات — كل بطاقة لها رابطها الخاص
   ═══════════════════════════════════════════════════════════ */
const categories = [
  { name: "العناية بالبشرة", subtitle: "بشرة صحية ومشرقة", image: "/images/rose-water-toner.webp", to: ROUTES.skincare },
  { name: "المكياج", subtitle: "عبّري عن أسلوبك", image: "/images/velvet-matte-lip-cream.jpg", to: ROUTES.makeup },
  { name: "الشنط", subtitle: "أناقة تكمّل إطلالتك", image: "/images/blush-structured-handbag.webp", to: "/shop?category=bags" },
  { name: "الأحذية", subtitle: "خطوة بأسلوب مميز", image: "/images/fuchsia-platform-mules.webp", to: "/shop?category=shoes" },
];

/* ═══════════════════════════════════════════════════════════
   AnnouncementBar
   ═══════════════════════════════════════════════════════════ */
function AnnouncementBar() {
  return (
    <div
      role="banner"
      className="relative overflow-hidden bg-gradient-to-r from-[#F8C9D4] via-[#F5B6C7] to-[#F8C9D4] px-4 py-3 text-center text-xs font-medium text-[#26151B] sm:text-sm"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-2">
        <span className="inline-flex items-center gap-1.5">
          <Truck className="h-4 w-4" aria-hidden="true" />
          شحن مجاني للطلبات فوق {formatPrice(FREE_SHIPPING_THRESHOLD)}
        </span>
        <span className="hidden h-4 w-px bg-[#9E526C]/50 md:block" aria-hidden="true" />
        <span className="hidden items-center gap-1.5 md:inline-flex">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          الدفع عند الاستلام
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   HeroSection — CTA يذهب إلى /shop (كتالوج كامل)
   ═══════════════════════════════════════════════════════════ */
function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#FBE4E9] to-[#F9DDE4]">
      <div className="mx-auto grid max-w-[1500px] items-center lg:grid-cols-2">
        <div className="px-6 py-12 lg:px-10 lg:py-16">
          <p className="mb-4 text-sm font-bold tracking-wide text-[#E83E78] sm:text-base">
            جمال مشرق. أنتِ الحقيقية.
          </p>

          <h1 className="text-4xl font-bold leading-[1.25] text-black sm:text-5xl lg:text-6xl">
            <span className="font-['Cormorant_Garamond',Georgia,serif]">Velora</span>
            <br />
            لإطلالة أكثر <span className="text-[#E83E78]">ثقة</span>
          </h1>

          <p className="mt-6 max-w-[450px] text-lg leading-8 text-[#26191E] sm:text-xl">
            منتجات عناية ومكياج فاخرة لجمالك الطبيعي.
          </p>

          {/* CTA → الكتالوج الكامل */}
          <Link
            to={ROUTES.shop}
            className="mt-8 inline-flex h-14 items-center gap-4 rounded-full bg-gradient-to-r from-[#E83E78] to-[#CA2867] px-8 text-base font-semibold text-white shadow-lg shadow-pink-500/20 transition hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E83E78] focus:ring-offset-2"
          >
            تسوّقي المجموعة
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </Link>

          <p className="mt-8 inline-flex items-center gap-2 rounded-full bg-white/70 px-5 py-2.5 text-sm font-bold text-[#781D3B] shadow-sm">
            <Truck className="h-5 w-5" aria-hidden="true" />
            شحن مجاني للطلبات فوق {formatPrice(FREE_SHIPPING_THRESHOLD)} · الدفع عند الاستلام
          </p>
        </div>

        <div className="relative">
          <img
            src="/velora-hero.webp"
            alt="منتجات Velora للعناية والمكياج"
            fetchPriority="high"
            width="972"
            height="791"
            className="h-full w-full object-cover object-center lg:[mask-image:linear-gradient(to_left,transparent,black_18%)]"
          />
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   CategorySection — كل بطاقة تذهب لفئتها
   ═══════════════════════════════════════════════════════════ */
function TrustStrip() {
  const items = [
    { Icon: Truck, title: "توصيل لكل المحافظات", text: `شحن مجاني فوق ${formatPrice(FREE_SHIPPING_THRESHOLD)}` },
    { Icon: Banknote, title: "الدفع عند الاستلام", text: "ادفعي لمندوب الشحن بعد المعاينة" },
    { Icon: RotateCcw, title: "استرجاع واستبدال", text: `خلال ${RETURN_DAYS} يوم من الاستلام` },
    { Icon: Headset, title: "دعم على واتساب", text: "بنرد عليكي بشكل مباشر" },
  ];
  return (
    <section aria-label="مميزات المتجر" className="border-b border-[#F3D5DD] bg-white">
      <ul className="mx-auto grid max-w-[1500px] grid-cols-2 gap-y-6 px-5 py-7 lg:grid-cols-4 lg:px-10">
        {items.map(({ Icon, title, text }) => (
          <li key={title} className="flex items-center gap-3 pe-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#FBE4EA] text-[#C2557A]">
              <Icon className="h-6 w-6" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-bold text-[#4A2C3A]">{title}</span>
              <span className="block text-xs leading-5 text-[#8C6F7B]">{text}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SectionTitle({ id, title, subtitle }) {
  return (
    <div className="mb-9 flex items-center justify-center gap-6 text-center">
      <span className="hidden h-px w-24 bg-[#E83E78]/60 sm:block" aria-hidden="true" />
      <div>
        <h2 id={id} className="text-3xl font-bold text-[#4A2C3A] sm:text-4xl">{title}</h2>
        {subtitle && <p className="mt-2 text-sm text-[#8C6F7B] sm:text-base">{subtitle}</p>}
      </div>
      <span className="hidden h-px w-24 bg-[#E83E78]/60 sm:block" aria-hidden="true" />
    </div>
  );
}

function CategorySection() {
  return (
    <section aria-labelledby="cat-h" className="mx-auto max-w-[1500px] px-5 pb-6 pt-14 lg:px-10">
      <SectionTitle id="cat-h" title="تسوّقي حسب الفئة" subtitle="كل اللي تحتاجيه في مكان واحد" />
      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {categories.map((c) => (
          <Link
            key={c.name}
            to={c.to}
            aria-label={`تسوقي ${c.name}`}
            className="group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-[#FBE4EA] outline-none focus-visible:ring-2 focus-visible:ring-[#E83E78] focus-visible:ring-offset-2"
          >
            <img src={c.image} alt="" loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#3A1A28]/80 via-[#3A1A28]/10 to-transparent" aria-hidden="true" />
            <div className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-6">
              <h3 className="text-xl font-bold sm:text-2xl">{c.name}</h3>
              <p className="mt-1 text-xs text-white/85 sm:text-sm">{c.subtitle}</p>
              <span className="mt-3 inline-flex items-center gap-2 text-xs font-bold sm:text-sm">
                تسوّقي الآن
                <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1" aria-hidden="true" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ProductRow({ id, title, subtitle, products, linkTo, linkLabel }) {
  const { cart = [], wishlist = [], addToCart, toggleWishlist } = useCart();
  const navigate = useNavigate();
  const isWishlisted = (pid) => Array.isArray(wishlist) ? wishlist.includes?.(pid) || wishlist.some?.((p) => (p?.id ?? p) === pid) : false;
  const qty = (pid) => (cart || []).filter((i) => (i?.product?.id ?? i?.id) === pid).reduce((t, i) => t + (i?.quantity || 0), 0);
  if (products.length === 0) return null;
  return (
    <section aria-labelledby={id} className="mx-auto max-w-[1500px] px-5 pb-6 pt-14 lg:px-10">
      <SectionTitle id={id} title={title} subtitle={subtitle} />
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} cartQty={qty(product.id)} isWishlisted={isWishlisted(product.id)} onAddToCart={addToCart} onToggleWishlist={toggleWishlist} onOpen={(p) => navigate(`/product/${p.id}`)} />
        ))}
      </div>
      {linkTo && (
        <div className="mt-10 text-center">
          <Link to={linkTo} className="inline-flex h-12 items-center justify-center rounded-full border border-[#E83E78] px-8 text-sm font-semibold text-[#C52E68] transition hover:bg-[#E83E78] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#E83E78] focus:ring-offset-2">
            {linkLabel}
          </Link>
        </div>
      )}
    </section>
  );
}

function WhatsAppBand() {
  if (!WHATSAPP_NUMBER) return null;
  return (
    <section aria-label="تواصل معنا" className="mx-auto max-w-[1500px] px-5 pb-6 pt-14 lg:px-10">
      <div className="flex flex-col items-center gap-5 rounded-3xl bg-gradient-to-br from-[#781D3B] to-[#B03A66] px-6 py-12 text-center text-white sm:py-14">
        <h2 className="text-2xl font-bold sm:text-3xl">محتارة تختاري؟ كلمينا وهنساعدك</h2>
        <p className="max-w-xl text-sm leading-7 text-white/85 sm:text-base">ابعتيلنا على واتساب وهنرشحلك المنتج المناسب لبشرتك أو لإطلالتك ونجهّز طلبك.</p>
        <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center gap-2 rounded-full bg-[#1FAF5A] px-8 text-sm font-bold text-white transition hover:bg-[#188A47]">
          <MessageCircle className="h-5 w-5" aria-hidden="true" />
          ابدأي المحادثة على واتساب
        </a>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   HomePage
   ═══════════════════════════════════════════════════════════ */
const newIn = mockProducts.filter((p) => p.badge === "جديد").slice(0, 4);
const best = mockProducts.filter((p) => p.badge === "الأكثر مبيعاً").sort((a, b) => b.rating - a.rating).slice(0, 8);

export default function HomePage() {
  useDocumentTitle("Velora | متجر العناية بالبشرة والمكياج");
  return (
    <div
      dir="rtl"
      className="min-h-screen overflow-x-hidden bg-[#FFFAFB] font-['Tajawal',system-ui,sans-serif] text-[#171313]"
    >
      <AnnouncementBar />
      <SiteHeader />
      <main>
        <HeroSection />
        <TrustStrip />
        <CategorySection />
        <ProductRow id="new-h" title="وصل حديثاً" subtitle="أحدث إضافاتنا" products={newIn} linkTo={ROUTES.shop} linkLabel="شوفي كل المنتجات" />
        <ProductRow id="best-h" title="الأكثر مبيعاً" subtitle="اختياراتنا الأكثر طلباً من عميلاتنا." products={best} linkTo={ROUTES.bestSellers} linkLabel="عرض الأكثر مبيعاً" />
        <WhatsAppBand />
      </main>

    </div>
  );
}