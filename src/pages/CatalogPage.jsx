// src/pages/CatalogPage.jsx
import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { SlidersHorizontal, X } from "lucide-react";
import SearchBar from "../components/catalog/SearchBar";
import FilterPanel, { FilterSheet } from "../components/catalog/FilterPanel";
import ProductGrid from "../components/catalog/ProductGrid";
import useCatalogFilters from "../components/catalog/useCatalogFilters";
import { mockProducts } from "../components/catalog/mockProducts";
import { CATEGORIES, L, SKIN_LABELS, SORT_OPTIONS, formatPrice } from "../components/catalog/catalogConfig";

import useDocumentTitle from "../utils/useDocumentTitle";

export default function CatalogPage({
  products = mockProducts,
  isLoading = false,
  cartItems = [],
  currency,
  headerActions = null, // مكان لزر/أيقونة السلة من الأجينت الثاني
  wishlistIds,
  onAddToCart,
  onToggleWishlist,
  onOpenProduct,
  initialFilters, // من رابط /shop?category=...&skin=...&offers=1&sort=...&q=...
}) {
  useDocumentTitle("المتجر | Velora");
  const f = useCatalogFilters(products, initialFilters);
  const [sheetOpen, setSheetOpen] = useState(false);

  // المفضلة: تعمل محلياً إن لم يمرّر أحد wishlistIds
  const [localWish, setLocalWish] = useState(() => new Set());
  const wishSet = wishlistIds ? new Set(wishlistIds) : localWish;
  const handleWish = useCallback(
    (id) => {
      if (onToggleWishlist) return onToggleWishlist(id);
      setLocalWish((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });
    },
    [onToggleWishlist]
  );

  const panel = (
    <FilterPanel
      skinOptions={f.skinOptions}
      skinTypes={f.skinTypes}
      onToggleSkinType={f.toggleSkinType}
      bounds={f.bounds}
      priceMin={f.priceMin}
      priceMax={f.priceMax}
      onChangeMin={f.changeMin}
      onChangeMax={f.changeMax}
      currency={currency}
      onReset={f.resetAll}
      canReset={f.hasAnyFilter}
    />
  );

  const chip = "inline-flex items-center gap-1 rounded-full bg-[#FBE4EA] py-1 ps-3 pe-1.5 text-xs font-medium text-[#4A2C3A]";

  return (
    <div dir="rtl" className="min-h-screen bg-[#FFF9FA] font-['Tajawal',system-ui,sans-serif] text-[#4A2C3A]">
      <header className="sticky top-0 z-30 border-b border-[#F3D5DD] bg-[#FFF9FA]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <Link to="/" className="flex shrink-0 items-center transition hover:opacity-80">
  <img
    src="/velora-logo.png"
    alt="Velora"
   
    className="h-16 w-auto object-contain sm:h-20" 
  />
</Link>
          <div className="order-2 ms-auto flex items-center gap-2 md:order-3 md:ms-0">{headerActions}</div>
          <SearchBar value={f.query} onChange={f.setQuery} className="order-3 w-full md:order-2 md:w-auto md:max-w-xl md:flex-1" />
        </div>
        <nav aria-label="الأقسام" className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={f.category === c.id}
              onClick={() => f.setCategory(c.id)}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#C2557A] ${
                f.category === c.id
                  ? "border-[#4A2C3A] bg-[#4A2C3A] text-white"
                  : "border-[#F3D5DD] bg-white text-[#4A2C3A] hover:border-[#C2557A]"
              }`}
            >
              {c.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 lg:grid lg:grid-cols-[240px_1fr] lg:gap-10">
        <aside className="sticky top-36 hidden self-start lg:block" aria-label={L.filters}>
          {panel}
        </aside>

        <section aria-label="المنتجات">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-[#8C6F7B]" aria-live="polite">{L.results(f.filtered.length)}</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSheetOpen(true)}
                className="relative flex h-10 items-center gap-2 rounded-full border border-[#F3D5DD] bg-white px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#C2557A] lg:hidden"
              >
                <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                {L.filters}
                {f.activeFilterCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#C2557A] px-1 text-xs font-bold text-white">
                    {f.activeFilterCount}
                  </span>
                )}
              </button>
              <label className="sr-only" htmlFor="catalog-sort">{L.sort}</label>
              <select
                id="catalog-sort"
                value={f.sort}
                onChange={(e) => f.setSort(e.target.value)}
                className="h-10 rounded-full border border-[#F3D5DD] bg-white px-4 text-sm outline-none focus:border-[#C2557A] focus-visible:ring-2 focus-visible:ring-[#C2557A]/30"
              >
                {SORT_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {f.activeFilterCount > 0 && (
            <div className="mb-5 flex flex-wrap gap-2">
              {f.skinTypes.map((t) => (
                <span key={t} className={chip}>
                  {SKIN_LABELS[t] ?? t}
                  <button type="button" onClick={() => f.toggleSkinType(t)} aria-label={`إزالة ${SKIN_LABELS[t] ?? t}`} className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-white">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {f.onlyOffers && (
                <span className={chip}>
                  العروض فقط
                  <button type="button" onClick={() => f.setOnlyOffers(false)} aria-label="إزالة فلتر العروض" className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-white">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {f.priceActive && (
                <span className={chip}>
                  {formatPrice(f.priceMin, currency)} - {formatPrice(f.priceMax, currency)}
                  <button type="button" onClick={f.resetPrice} aria-label="إزالة فلتر السعر" className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-white">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          )}

          <ProductGrid
            products={f.filtered}
            isLoading={isLoading}
            cartItems={cartItems}
            wishlistIds={wishSet}
            currency={currency}
            onAddToCart={onAddToCart}
            onToggleWishlist={handleWish}
            onOpenProduct={onOpenProduct}
            onResetFilters={f.resetAll}
          />
        </section>
      </main>

      <FilterSheet open={sheetOpen} onClose={() => setSheetOpen(false)} resultCount={f.filtered.length}>
        {panel}
      </FilterSheet>
    </div>
  );
}
