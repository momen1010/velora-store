// src/pages/WishlistPage.jsx  →  المسار: /wishlist
import { useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import PageShell from "../components/layout/PageShell";
import ProductGrid from "../components/catalog/ProductGrid";
import { useCatalog } from "../context/CatalogContext";
import { useCart } from "../context/CartContext";

import useDocumentTitle from "../utils/useDocumentTitle";

export default function WishlistPage() {
  useDocumentTitle("المفضلة | Velora");
  const navigate = useNavigate();
  const { cart, wishlist, addToCart, toggleWishlist } = useCart();

  useEffect(() => {
    document.title = "المفضلة | velora";
  }, []);

  const { products: mockProducts } = useCatalog();
  const wishSet = useMemo(() => new Set(wishlist), [wishlist]);
  // نحافظ على ترتيب الإضافة، ونتجاهل أي معرّف لم يعد موجوداً في الكتالوج
  const products = useMemo(
    () => wishlist.map((id) => mockProducts.find((p) => p.id === id)).filter(Boolean),
    [wishlist, mockProducts]
  );

  return (
    <PageShell>
      <div className="mb-6 flex items-baseline justify-between gap-3">
        <h1 className="text-2xl font-bold">المفضلة</h1>
        {products.length > 0 && <p className="text-sm text-[#8C6F7B]">{products.length} منتج</p>}
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-[#F3D5DD] px-6 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FBE4EA]">
            <Heart className="h-7 w-7 text-[#C2557A]" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-bold">قائمة المفضلة فارغة</h2>
          <p className="max-w-sm text-sm leading-6 text-[#8C6F7B]">اضغط على القلب في أي منتج لحفظه هنا والرجوع إليه لاحقاً.</p>
          <Link to="/" className="mt-2 flex h-12 items-center rounded-full bg-[#4A2C3A] px-8 text-sm font-bold text-white hover:bg-[#C2557A]">
            تصفّح المنتجات
          </Link>
        </div>
      ) : (
        <ProductGrid
          products={products}
          cartItems={cart}
          wishlistIds={wishSet}
          onAddToCart={addToCart}
          onToggleWishlist={toggleWishlist}
          onOpenProduct={(p) => navigate(`/product/${p.id}`)}
        />
      )}
    </PageShell>
  );
}
