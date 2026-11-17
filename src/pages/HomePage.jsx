import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  UserRound,
  Truck,
  ShieldCheck,
  Headset,
  ArrowRight,
  Sparkles,
  Menu,
  X,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

// ─── Cart (الموجود في مشروعك) ─────────────────────────────
import { useCart } from "../context/CartContext";

// ─── Layout + Catalog ─────────────────────────────────────
import { HeaderActions } from "../components/layout/SiteHeader";
import ProductCard from "../components/catalog/ProductCard";
import { mockProducts } from "../components/catalog/mockProducts";
import { formatPrice } from "../components/catalog/catalogConfig";

/* ═══════════════════════════════════════════════════════════
   ثابت الشحن المجاني (كان مفقوداً)
   ═══════════════════════════════════════════════════════════ */
const FREE_SHIPPING_THRESHOLD = 800; // بالجنيه المصري

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
  hairCare: "/shop?category=hair-care",
  fragrances: "/shop?category=fragrances",
  bundles: "/shop?category=bundles",
  offers: "/shop?filter=offers",
  search: "/shop?focus=search",
};

/* ═══════════════════════════════════════════════════════════
   بيانات بطاقات الفئات — كل بطاقة لها رابطها الخاص
   ═══════════════════════════════════════════════════════════ */
const categories = [
  {
    name: "Skincare",
    subtitle: "Healthy, Glowing Skin",
    image: "/images/products/hydra-dew.svg",
    color: "#F7D4DC",
    to: ROUTES.skincare, // ← يذهب لقسم العناية بالبشرة
  },
  {
    name: "Makeup",
    subtitle: "Express Your Style",
    image: "/images/products/velvet-lip.svg",
    color: "#F6C4D0",
    to: ROUTES.makeup, // ← يذهب لقسم المكياج
  },
  {
    name: "Hair Care",
    subtitle: "Strong & Shiny Hair",
    image: null,
    color: "#F8DCCB",
    to: ROUTES.hairCare, // ← يذهب لقسم العناية بالشعر
  },
  {
    name: "Fragrances",
    subtitle: "Lasting Impressions",
    image: null,
    color: "#F5D0D9",
    to: ROUTES.fragrances, // ← يذهب لقسم العطور
  },
];

/* ═══════════════════════════════════════════════════════════
   روابط الناف بار — كل رابط له وجهة صحيحة
   ═══════════════════════════════════════════════════════════ */
const NAV_LINKS = [
  { label: "Shop", to: ROUTES.shop, hasDropdown: true },
  { label: "Best Sellers", to: ROUTES.bestSellers }, // ← فلتر الأكثر مبيعاً
  { label: "Skincare", to: ROUTES.skincare, hasDropdown: true },
  { label: "Makeup", to: ROUTES.makeup, hasDropdown: true },
  { label: "Bundles", to: ROUTES.bundles },
  { label: "Offers", to: ROUTES.offers }, // ← فلتر العروض
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
          Free Shipping on orders over {formatPrice(FREE_SHIPPING_THRESHOLD)}
        </span>
        <span className="hidden h-4 w-px bg-[#9E526C]/50 md:block" aria-hidden="true" />
        <span className="inline-flex items-center gap-1.5">

        </span>
        <span className="hidden h-4 w-px bg-[#9E526C]/50 lg:block" aria-hidden="true" />
        <span className="hidden items-center gap-1.5 lg:inline-flex">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          Beauty Today. Confidence Forever.
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   HomeHeader
   ═══════════════════════════════════════════════════════════ */
function HomeHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <header className="sticky top-0 z-40 border-b border-[#F3D5DD] bg-white/95 backdrop-blur">
      <div className="mx-auto flex min-h-[78px] max-w-[1500px] items-center justify-between gap-4 px-5 lg:px-10">
        {/* Logo → الرئيسية */}
         


{/* ─── Logo ─── */}
<Link
  to={ROUTES.home}
  onClick={closeMobile}
  className="flex shrink-0 items-center transition hover:opacity-80"
  aria-label="Velora - الصفحة الرئيسية"
>
  <img
  src="/velora-logo.png"
  alt="Velora"
  className="h-20 w-auto object-contain sm:h-24 lg:h-28"
/>
</Link>

        {/* Desktop Nav */}
        <nav
          aria-label="التنقل الرئيسي"
          className="hidden items-center gap-8 text-sm font-medium text-[#21171B] lg:flex"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="inline-flex items-center gap-0.5 transition hover:text-[#E83E78]"
            >
              {link.label}
              {link.hasDropdown && <span className="text-xs">⌄</span>}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-3">
          <Link
            to={ROUTES.search}
            aria-label="البحث عن المنتجات"
            className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-pink-50"
          >
            <Search className="h-6 w-6" />
          </Link>

          <HeaderActions />

          <button
            type="button"
            aria-label="حساب المستخدم"
            className="hidden h-10 w-10 items-center justify-center rounded-full transition hover:bg-pink-50 sm:flex"
          >
            <UserRound className="h-6 w-6" />
          </button>

          {/* Mobile toggle */}
          <button
            type="button"
            aria-label={mobileOpen ? "إغلاق القائمة" : "فتح القائمة"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-pink-50 lg:hidden"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <nav
          aria-label="التنقل للجوال"
          className="border-t border-[#F3D5DD] bg-white lg:hidden"
        >
          <ul className="mx-auto max-w-[1500px] px-5 py-3">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  to={link.to}
                  onClick={closeMobile}
                  className="block rounded-lg px-3 py-3 text-sm font-medium text-[#21171B] transition hover:bg-pink-50 hover:text-[#E83E78]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}

/* ═══════════════════════════════════════════════════════════
   HeroSection — CTA يذهب إلى /shop (كتالوج كامل)
   ═══════════════════════════════════════════════════════════ */
function HeroSection() {
  return (
    <section className="relative min-h-[500px] overflow-hidden bg-[#F9DDE4] lg:min-h-[525px]">
      <img
        src="/velora-hero.png"
        alt="velora Beauty Collection"
        fetchPriority="high"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#FBE4E9]/95 via-[#FBE4E9]/65 to-transparent lg:w-[65%]" />

      <div className="relative mx-auto flex min-h-[500px] max-w-[1500px] items-center px-6 py-14 lg:min-h-[525px] lg:px-10">
        <div className="max-w-[700px]">
          <p className="mb-4 text-sm font-bold tracking-[0.22em] text-[#E83E78] sm:text-base">
            RADIANT BEAUTY. REAL YOU.
          </p>

          <h1 className="max-w-[720px] font-['Cormorant_Garamond',Georgia,serif] text-5xl font-bold leading-[1.05] text-black sm:text-6xl lg:text-[76px]">
            velora Beauty
            <br />
            For a More <span className="italic text-[#E83E78]">Confident</span> You
          </h1>

          <p className="mt-6 max-w-[450px] text-lg leading-8 text-[#26191E] sm:text-xl">
            Premium skincare &amp; makeup products for your natural beauty.
          </p>

          {/* CTA → الكتالوج الكامل */}
          <Link
            to={ROUTES.shop}
            className="mt-8 inline-flex h-14 items-center gap-4 rounded-full bg-gradient-to-r from-[#E83E78] to-[#CA2867] px-8 text-base font-semibold text-white shadow-lg shadow-pink-500/20 transition hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E83E78] focus:ring-offset-2"
          >
            Shop the Collection
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>

          {/* Trust Indicators */}
          <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-5 text-sm text-[#26191E]">
            <div className="flex items-center gap-3">
              <Truck className="h-8 w-8 shrink-0" aria-hidden="true" />
              <span>
                Free Shipping
                <br />
                Over {formatPrice(FREE_SHIPPING_THRESHOLD)}
              </span>
            </div>
            <div className="hidden h-9 w-px bg-[#B76C85] sm:block" aria-hidden="true" />
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-8 w-8 shrink-0" aria-hidden="true" />
              <span>
                Secure
                <br />
                Payments
              </span>
            </div>
            <div className="hidden h-9 w-px bg-[#B76C85] sm:block" aria-hidden="true" />
            <div className="flex items-center gap-3">
              <Headset className="h-8 w-8 shrink-0" aria-hidden="true" />
              <span>
                24/7 Customer
                <br />
                Support
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   CategorySection — كل بطاقة تذهب لفئتها
   ═══════════════════════════════════════════════════════════ */
function CategorySection() {
  return (
    <section
      aria-label="تسوقي حسب الفئة"
      className="mx-auto max-w-[1500px] px-5 py-7 lg:px-10"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {categories.map((category) => (
          <Link
            key={category.name}
            to={category.to}
            aria-label={`تسوقي ${category.name}`}
            className="group relative flex min-h-[190px] items-center overflow-hidden rounded-2xl p-6 transition duration-300 hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E83E78] focus:ring-offset-2"
            style={{ backgroundColor: category.color }}
          >
            {category.image ? (
              <img
                src={category.image}
                alt=""
                aria-hidden="true"
                loading="lazy"
                className="absolute inset-y-0 end-0 h-full w-[55%] object-contain transition duration-500 group-hover:scale-110"
              />
            ) : (
              <Sparkles
                className="absolute end-8 h-24 w-24 text-white/60 transition duration-500 group-hover:scale-110"
                aria-hidden="true"
              />
            )}

            <div className="relative z-10 max-w-[65%]">
              <h2 className="font-['Cormorant_Garamond',Georgia,serif] text-3xl font-bold text-black">
                {category.name}
              </h2>
              <p className="mt-1 text-sm text-black">{category.subtitle}</p>
              <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/40 px-4 py-2 text-sm font-semibold text-black transition group-hover:bg-white">
                Shop Now
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   BestSellers
   ═══════════════════════════════════════════════════════════ */
function BestSellers() {
  const { cart = [], wishlist = [], addToCart, toggleWishlist } = useCart();
  const navigate = useNavigate();

  const products = useMemo(
    () =>
      mockProducts
        .filter((p) => p.badge === "الأكثر مبيعاً")
        .sort((a, b) => b.rating - a.rating),
    []
  );

  const isWishlisted = (productId) =>
    Array.isArray(wishlist)
      ? wishlist.includes?.(productId) ||
        wishlist.some?.((p) => (p?.id ?? p) === productId)
      : false;

  const getCartQty = (productId) =>
    (cart || [])
      .filter((item) => (item?.product?.id ?? item?.id) === productId)
      .reduce((total, item) => total + (item?.quantity || 0), 0);

  return (
    <section
      aria-labelledby="best-sellers-heading"
      className="mx-auto max-w-[1500px] px-5 pb-20 pt-7 lg:px-10"
    >
      <div className="mb-9 flex items-center justify-center gap-6 text-center">
        <span className="hidden h-px w-24 bg-[#E83E78] sm:block" aria-hidden="true" />
        <div>
          <h2
            id="best-sellers-heading"
            className="font-['Cormorant_Garamond',Georgia,serif] text-4xl font-bold text-black sm:text-5xl"
          >
            Best Sellers
          </h2>
          <p className="mt-2 text-sm text-[#5D424D] sm:text-base">
            Loved by thousands of beauty enthusiasts.
          </p>
        </div>
        <span className="hidden h-px w-24 bg-[#E83E78] sm:block" aria-hidden="true" />
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            cartQty={getCartQty(product.id)}
            isWishlisted={isWishlisted(product.id)}
            onAddToCart={addToCart}
            onToggleWishlist={toggleWishlist}
            onOpen={(p) => navigate(`/product/${p.id}`)}
          />
        ))}
      </div>

      {/* زر "عرض الكل" → صفحة الأكثر مبيعاً */}
      <div className="mt-10 text-center">
        <Link
          to={ROUTES.bestSellers}
          className="inline-flex h-12 items-center justify-center rounded-full border border-[#E83E78] px-8 text-sm font-semibold text-[#C52E68] transition hover:bg-[#E83E78] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#E83E78] focus:ring-offset-2"
        >
          View All Products
        </Link>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   HomePage
   ═══════════════════════════════════════════════════════════ */
export default function HomePage() {
  return (
    <div
      dir="ltr"
      className="min-h-screen overflow-x-hidden bg-[#FFFAFB] font-['Inter',system-ui,sans-serif] text-[#171313]"
    >
      <AnnouncementBar />
      <HomeHeader />
      <main>
        <HeroSection />
        <CategorySection />
        <BestSellers />
      </main>
    </div>
  );
}