// src/components/catalog/ProductCard.jsx
import { useEffect, useRef, useState } from "react";
import { Check, Heart, ShoppingBag, Sparkles, Star } from "lucide-react";
import ShadeSwatches from "./ShadeSwatches";
import { L, formatPrice, getDiscount } from "./catalogConfig";

export default function ProductCard({
  product,
  cartQty = 0,
  isWishlisted = false,
  currency,
  onAddToCart,
  onToggleWishlist,
  onOpen,
}) {
  const { name, brand, price, oldPrice, rating, reviews, badge, image, shades = [] } = product;
  const [shadeIdx, setShadeIdx] = useState(0);
  const [previewIdx, setPreviewIdx] = useState(null);
  const [added, setAdded] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const selectedShade = shades[shadeIdx] ?? null;
  const shownShade = shades[previewIdx ?? shadeIdx] ?? null;
  const discount = getDiscount(product);

  const handleAdd = () => {
    onAddToCart?.(product, selectedShade); // (product, shade|null)
    setAdded(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 1600);
  };

  return (
    <article className="group flex flex-col">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#FBE4EA]">
        {image && !imgFailed ? (
          <img
            src={image}
            alt={`${brand} ${name}`}
            loading="lazy"
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center transition-colors duration-300"
            style={{ background: `linear-gradient(160deg, #FFF1F4 0%, ${shownShade?.hex ?? "#F7CFD9"} 100%)` }}
          >
            <Sparkles className="h-8 w-8 text-white/80" aria-hidden="true" />
          </div>
        )}

        {onOpen && (
          <button type="button" onClick={() => onOpen(product)} aria-label={`${brand} ${name}`} className="absolute inset-0 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#C2557A]" />
        )}

        {discount ? (
          <span className="absolute start-2 top-2 rounded-full bg-[#C2557A] px-2 py-0.5 text-xs font-bold text-white">
            -{discount}%
          </span>
        ) : null}

        <button
          type="button"
          onClick={() => onToggleWishlist?.(product.id)}
          aria-pressed={isWishlisted}
          aria-label={isWishlisted ? L.removeFromWishlist : L.addToWishlist}
          className="absolute end-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#4A2C3A] outline-none transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-[#C2557A]"
        >
          <Heart className={`h-[18px] w-[18px] ${isWishlisted ? "fill-[#C2557A] text-[#C2557A]" : ""}`} />
        </button>

        {badge && (
          <span className="absolute bottom-2 start-2 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-[#4A2C3A]">
            {badge}
          </span>
        )}

        <button
          type="button"
          onClick={handleAdd}
          aria-label={`${L.addToCart}: ${name}${selectedShade ? ` - ${selectedShade.name}` : ""}`}
          className={`absolute bottom-2 end-2 flex h-10 w-10 items-center justify-center rounded-full text-white shadow-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#C2557A] focus-visible:ring-offset-2 ${
            added ? "bg-[#C2557A]" : "bg-[#4A2C3A] hover:bg-[#C2557A]"
          }`}
        >
          {added ? <Check className="h-5 w-5" /> : <ShoppingBag className="h-5 w-5" />}
          {cartQty > 0 && !added && (
            <span className="absolute -end-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#C2557A] px-1 text-[10px] font-bold text-white" aria-label={L.inCart(cartQty)}>
              {cartQty}
            </span>
          )}
        </button>
        <span className="sr-only" role="status">{added ? L.addedToCart : ""}</span>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 pt-3">
        <p className="text-xs text-[#8C6F7B]">{brand}</p>
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-5 text-[#4A2C3A]">{name}</h3>

        {shades.length > 0 && (
          <div>
            <ShadeSwatches shades={shades} selectedIndex={shadeIdx} onSelect={setShadeIdx} onPreview={setPreviewIdx} />
            <p className="mt-0.5 truncate text-xs text-[#8C6F7B]">
              {L.shade}: {shownShade?.name}
            </p>
          </div>
        )}

        <div className="flex items-center gap-1 text-xs text-[#8C6F7B]">
          <Star className="h-3.5 w-3.5 fill-[#E9A23B] text-[#E9A23B]" aria-hidden="true" />
          <span className="font-medium text-[#4A2C3A]">{rating.toFixed(1)}</span>
          <span>({reviews.toLocaleString("ar-EG")} {L.reviews})</span>
        </div>

        <div className="mt-auto flex items-baseline gap-2 pt-0.5">
          <span className="text-base font-bold text-[#C2557A]">{formatPrice(price, currency)}</span>
          {oldPrice && oldPrice > price && (
            <span className="text-xs text-[#8C6F7B] line-through">{formatPrice(oldPrice, currency)}</span>
          )}
        </div>
      </div>
    </article>
  );
}
