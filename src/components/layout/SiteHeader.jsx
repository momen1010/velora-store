// src/components/layout/SiteHeader.jsx
// هيدر الصفحات الداخلية (المنتج، المفضلة، الدفع...) + أزرار المفضلة والسلة.
import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Search, Menu, X } from "lucide-react";
import { CartButton } from "../cart/CartDrawer";
import { useCart } from "../../context/CartContext";

export function WishlistLink({ className = "" }) {
  const { wishlist } = useCart();
  const count = wishlist.length;
  return (
    <Link
      to="/wishlist"
      aria-label={count ? `المفضلة، ${count} منتج` : "المفضلة"}
      className={`relative flex h-11 w-11 items-center justify-center rounded-full border border-rose-100 bg-white text-stone-800 outline-none transition-colors hover:border-rose-500 focus-visible:ring-2 focus-visible:ring-rose-500 ${className}`}
    >
      <Heart className="h-5 w-5" aria-hidden="true" />
      {count > 0 && (
        <span className="absolute -end-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-xs font-bold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}

// أزرار الهيدر الجاهزة (تُمرَّر أيضاً لـ CatalogPage عبر headerActions)
export function HeaderActions() {
  return (
    <>
      <WishlistLink />
      <CartButton />
    </>
  );
}

const NAV_LINKS = [
  { label: "المتجر", to: "/shop" },
  { label: "العناية بالبشرة", to: "/shop?category=skincare" },
  { label: "المكياج", to: "/shop?category=makeup" },
  { label: "الشنط", to: "/shop?category=bags" },
  { label: "الأحذية", to: "/shop?category=shoes" },
  { label: "العروض", to: "/shop?filter=offers" },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-[#F3D5DD] bg-white/95 backdrop-blur">
      <div className="mx-auto flex min-h-[72px] max-w-[1500px] items-center justify-between gap-4 px-4 lg:px-10">
        <Link to="/" onClick={() => setOpen(false)} className="flex shrink-0 items-center transition hover:opacity-80" aria-label="Velora - الصفحة الرئيسية">
          <img src="/velora-logo.png" alt="Velora" className="h-16 w-auto object-contain sm:h-20" />
        </Link>

        <nav aria-label="التنقل الرئيسي" className="hidden items-center gap-8 text-sm font-medium text-[#21171B] lg:flex">
          {NAV_LINKS.map((l) => (
            <Link key={l.label} to={l.to} className="transition hover:text-[#C2557A]">{l.label}</Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <Link to="/shop?focus=search" aria-label="البحث عن المنتجات" className="flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-pink-50">
            <Search className="h-5 w-5" aria-hidden="true" />
          </Link>
          <HeaderActions />
          <button
            type="button"
            aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-pink-50 lg:hidden"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <nav aria-label="التنقل للجوال" className="border-t border-[#F3D5DD] bg-white lg:hidden">
          <ul className="mx-auto max-w-[1500px] px-4 py-3">
            {NAV_LINKS.map((l) => (
              <li key={l.label}>
                <Link to={l.to} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-3 text-sm font-medium text-[#21171B] transition hover:bg-pink-50 hover:text-[#C2557A]">{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
