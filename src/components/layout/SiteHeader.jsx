// src/components/layout/SiteHeader.jsx
// هيدر الصفحات الداخلية (المنتج، المفضلة، الدفع...) + أزرار المفضلة والسلة.
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
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

export default function SiteHeader() {
 return (
  <header className="sticky top-0 z-30 border-b border-[#F3D5DD] bg-[#FFF9FA]/90 backdrop-blur">
    {/* زودنا الـ max-w لـ 7xl وخلينا العناصر flex مع justify-between */}
    <div className="mx-auto flex min-h-[90px] max-w-7xl items-center justify-between gap-4 px-4">
      
      {/* اللوجو: أول عنصر = على الشمال */}
      <Link 
        to="/" 
        className="flex shrink-0 items-center transition hover:opacity-80"
      >
        <img
          src="/velora-logo.png"
          alt="Velora"
          // كبرنا اللوجو لـ h-20 (80px) أو h-24 (96px) للشاشات الكبيرة
          className="h-20 w-auto object-contain sm:h-24" 
        />
      </Link>

      {/* باقي العناصر (البحث، السلة، المفضلة) هتكون على اليمين */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* شريط البحث */}
        <div className="hidden md:flex h-11 w-64 items-center rounded-full border border-rose-100 bg-white px-4">
          
        </div>

        {/* الأزرار */}
        <HeaderActions />
      </div>
      
    </div>
  </header>
);
}
