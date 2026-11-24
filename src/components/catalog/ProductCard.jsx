import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingBag } from "lucide-react";
import { formatPrice } from "./catalogConfig";

export default function ProductCard({ product, onAddToCart, onToggleWishlist, isWishlisted, cartQty }) {
  const [selectedSize, setSelectedSize] = useState(null);

  const handleAddToCart = (e) => {
    e.preventDefault(); // منع فتح الرابط
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      alert("الرجاء اختيار المقاس أولاً");
      return;
    }
    // بنبعت المنتج، الكمية (1)، اللون (لو موجود)، المقاس
    onAddToCart(product, 1, product.shades?.[0] || null, selectedSize);
  };

  return (
    <div className="group relative flex flex-col rounded-2xl bg-white p-3 shadow-sm transition hover:shadow-md border border-gray-100">
      
      {/* الصورة والزراير فوقها */}
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-[#FCE7EC]">
        <Link to={`/product/${product.id}`}>
          <img
            src={product.image || "/placeholder.svg"}
            alt={product.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/placeholder.svg"; }}
          />
        </Link>
        
        {/* زر المفضلة */}
        <button
          onClick={(e) => { e.preventDefault(); onToggleWishlist(product); }}
          className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur transition hover:bg-white"
        >
          <Heart className={`h-4 w-4 ${isWishlisted ? "fill-velora-pink text-velora-pink" : "text-gray-500"}`} />
        </button>

        {/* شارة الخصم */}
        {product.discount && (
          <span className="absolute top-2 left-2 rounded-full bg-velora-pink px-2 py-1 text-xs font-bold text-white">
            {product.discount}%-
          </span>
        )}
      </div>

      {/* التفاصيل */}
      <div className="mt-3 flex flex-1 flex-col">
        <p className="text-xs text-gray-500">{product.brand}</p>
        <Link to={`/product/${product.id}`} className="text-sm font-semibold text-gray-800 hover:text-velora-pink line-clamp-1">
          {product.name}
        </Link>

        {/* 🔴 أزرار المقاسات */}
        {product.sizes && product.sizes.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {product.sizes.map((size) => (
              <button
                key={size}
                onClick={(e) => { e.preventDefault(); setSelectedSize(size); }}
                className={`rounded-md border px-2 py-0.5 text-xs transition ${
                  selectedSize === size
                    ? "border-[#4A2C3A] bg-[#4A2C3A] text-white"
                    : "border-gray-200 bg-white text-gray-600 hover:border-[#4A2C3A]"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        )}

        {/* السعر والزرار */}
        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-velora-pink">{formatPrice(product.price)}</span>
            {product.oldPrice && (
              <span className="text-xs text-gray-400 line-through">{formatPrice(product.oldPrice)}</span>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4A2C3A] text-white transition hover:bg-velora-pink"
            aria-label="أضف للسلة"
          >
            <ShoppingBag className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}