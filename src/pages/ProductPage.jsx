// src/pages/ProductPage.jsx
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Heart, ShoppingBag, ChevronLeft } from "lucide-react";
import { mockProducts } from "../components/catalog/mockProducts";
import useDocumentTitle from "../utils/useDocumentTitle";
import { useCart } from "../context/CartContext"; // أو useStore حسب مشروعك
import { formatPrice } from "../components/catalog/catalogConfig";

export default function ProductPage() {
  const { id } = useParams();
  const { addToCart, wishlist = [], toggleWishlist } = useCart();

  const product = mockProducts.find((p) => String(p.id) === String(id));
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(null);
  useDocumentTitle(product ? `${product.name} | Velora` : "المنتج غير موجود | Velora");

  if (!product) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-gray-800">المنتج غير موجود</h2>
        <Link to="/shop" className="mt-4 text-velora-pink hover:underline">العودة للمتجر</Link>
      </div>
    );
  }

  const isGoods = product.category === "bags" || product.category === "shoes";
  const isWishlisted = Array.isArray(wishlist) && (wishlist.includes(product.id) || wishlist.some(w => w?.id === product.id));

  const handleAddToCart = () => {
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      alert("الرجاء اختيار المقاس أولاً");
      return;
    }
    addToCart(product, quantity, null, selectedSize);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-10" dir="rtl">
      {/* Breadcrumb */}
      <div className="mb-8 flex items-center gap-2 text-sm text-gray-500">
        <Link to="/" className="hover:text-velora-pink">الرئيسية</Link>
        <ChevronLeft className="h-4 w-4" />
        <Link to={`/shop?category=${product.category}`} className="hover:text-velora-pink">
          {product.category === "bags" ? "الشنط" : product.category === "shoes" ? "الأحذية" : product.category === "makeup" ? "المكياج" : "العناية بالبشرة"}
        </Link>
        <ChevronLeft className="h-4 w-4" />
        <span className="font-semibold text-gray-800">{product.name}</span>
      </div>

      <div className="grid gap-10 md:grid-cols-2">
        {/* صورة المنتج */}
        <div className="overflow-hidden rounded-3xl bg-[#FCE7EC]">
          <img src={product.image || "/placeholder.svg"} alt={product.name} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/placeholder.svg"; }} className="h-full w-full object-cover aspect-square" />
        </div>

        {/* التفاصيل */}
        <div className="flex flex-col">
          <p className="text-sm font-medium text-velora-pink">{product.brand}</p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">{product.name}</h1>
          
          <div className="mt-3 flex items-center gap-2">
            <div className="flex text-yellow-400">⭐⭐⭐⭐⭐</div>
            <span className="text-sm text-gray-500">({product.rating} تقييم)</span>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <span className="text-3xl font-bold text-velora-pink">{formatPrice(product.price)}</span>
            {product.oldPrice && (
              <span className="text-lg text-gray-400 line-through">{formatPrice(product.oldPrice)}</span>
            )}
          </div>

          {product.skinType && (
             <p className="mt-2 text-sm text-gray-500">
               مناسب لـ: {product.skinType.includes("all") ? "جميع الأنواع" : product.skinType.join(", ")}
             </p>
          )}

          {/* المقاسات */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-3 text-sm font-semibold text-gray-800">اختر المقاس:</h3>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`rounded-lg border px-6 py-2 text-sm font-medium transition ${
                      selectedSize === size
                        ? "border-[#4A2C3A] bg-[#4A2C3A] text-white"
                        : "border-gray-300 bg-white text-gray-700 hover:border-[#4A2C3A]"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* الكمية والإضافة */}
          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center rounded-full border border-gray-300">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-2 text-lg hover:text-velora-pink">-</button>
              <span className="w-8 text-center font-medium">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="px-4 py-2 text-lg hover:text-velora-pink">+</button>
            </div>

            <button
              onClick={handleAddToCart}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#4A2C3A] py-3 font-semibold text-white transition hover:bg-velora-pink"
            >
              <ShoppingBag className="h-5 w-5" />
              أضف إلى السلة
            </button>

            <button
              onClick={() => toggleWishlist(product)}
              className={`flex h-12 w-12 items-center justify-center rounded-full border transition ${
                isWishlisted ? "border-velora-pink bg-pink-50 text-velora-pink" : "border-gray-300 text-gray-500 hover:border-velora-pink"
              }`}
            >
              <Heart className={`h-5 w-5 ${isWishlisted ? "fill-velora-pink" : ""}`} />
            </button>
          </div>

          {/* 🟢 قسم الوصف والمكونات وطريقة الاستخدام */}
          <div className="mt-10 border-t border-gray-200 pt-6">
            {/* الوصف */}
            <details className="group border-b border-gray-100 py-4" open>
              <summary className="flex cursor-pointer items-center justify-between font-semibold text-gray-800">
                <span>الوصف</span>
                <span className="transition group-open:rotate-180">
                  <ChevronLeft className="h-5 w-5 -rotate-90" />
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                {product.description || "لا يوجد وصف متاح لهذا المنتج."}
              </p>
            </details>

            {/* المكونات */}
            <details className="group border-b border-gray-100 py-4">
              <summary className="flex cursor-pointer items-center justify-between font-semibold text-gray-800">
                <span>{isGoods ? "الخامات والتفاصيل" : "المكونات"}</span>
                <span className="transition group-open:rotate-180">
                  <ChevronLeft className="h-5 w-5 -rotate-90" />
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                {product.ingredients || (isGoods ? "لا توجد تفاصيل مسجلة." : "لا توجد مكونات مسجلة.")}
              </p>
            </details>

            {/* طريقة الاستخدام */}
            <details className="group border-b border-gray-100 py-4">
              <summary className="flex cursor-pointer items-center justify-between font-semibold text-gray-800">
                <span>{isGoods ? "العناية بالمنتج" : "طريقة الاستخدام"}</span>
                <span className="transition group-open:rotate-180">
                  <ChevronLeft className="h-5 w-5 -rotate-90" />
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                {product.usage || "لم يتم إضافة طريقة استخدام."}
              </p>
            </details>
          </div>

        </div>
      </div>
    </div>
  );
}