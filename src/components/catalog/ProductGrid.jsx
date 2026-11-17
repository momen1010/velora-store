// src/components/catalog/ProductGrid.jsx
import { SearchX } from "lucide-react";
import ProductCard from "./ProductCard";
import { L } from "./catalogConfig";

function SkeletonCard() {
  return (
    <div className="animate-pulse motion-reduce:animate-none" aria-hidden="true">
      <div className="aspect-[4/5] rounded-2xl bg-[#FBE4EA]" />
      <div className="mt-3 h-3 w-1/3 rounded bg-[#FBE4EA]" />
      <div className="mt-2 h-4 w-4/5 rounded bg-[#FBE4EA]" />
      <div className="mt-3 h-4 w-1/2 rounded bg-[#FBE4EA]" />
    </div>
  );
}

export default function ProductGrid({
  products = [],
  isLoading = false,
  cartItems = [],
  wishlistIds,
  currency,
  onAddToCart,
  onToggleWishlist,
  onOpenProduct,
  onResetFilters,
}) {
  const gridClass = "grid grid-cols-2 gap-x-3 gap-y-7 md:grid-cols-3 md:gap-x-5 xl:grid-cols-4";

  if (isLoading) {
    return (
      <div className={gridClass} aria-busy="true">
        {Array.from({ length: 8 }, (_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-[#F3D5DD] px-6 py-16 text-center">
        <SearchX className="h-10 w-10 text-[#C2557A]" aria-hidden="true" />
        <h2 className="text-lg font-bold text-[#4A2C3A]">{L.emptyTitle}</h2>
        <p className="max-w-sm text-sm leading-6 text-[#8C6F7B]">{L.emptyBody}</p>
        {onResetFilters && (
          <button type="button" onClick={onResetFilters} className="mt-1 h-11 rounded-full bg-[#4A2C3A] px-6 text-sm font-bold text-white outline-none hover:bg-[#C2557A] focus-visible:ring-2 focus-visible:ring-[#C2557A] focus-visible:ring-offset-2">
            {L.resetAll}
          </button>
        )}
      </div>
    );
  }

  const qtyOf = (id) => cartItems.filter((i) => i.id === id).reduce((n, i) => n + (i.qty ?? i.quantity ?? 1), 0);

  return (
    <div className={gridClass}>
      {products.map((p) => (
        <ProductCard
          key={p.id}
          product={p}
          currency={currency}
          cartQty={qtyOf(p.id)}
          isWishlisted={wishlistIds?.has(p.id)}
          onAddToCart={onAddToCart}
          onToggleWishlist={onToggleWishlist}
          onOpen={onOpenProduct}
        />
      ))}
    </div>
  );
}
