import { useEffect } from "react";
import {
  BrowserRouter,
  Link,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";

import useDocumentTitle from "./utils/useDocumentTitle";
import WhatsAppButton from "./components/layout/WhatsAppButton";
import { CartProvider, useCart } from "./context/CartContext";
import CartDrawer from "./components/cart/CartDrawer";
import PageShell from "./components/layout/PageShell";
import { HeaderActions } from "./components/layout/SiteHeader";

import HomePage from "./pages/HomePage";
import CatalogPage from "./pages/CatalogPage";
import ProductPage from "./pages/ProductPage";
import WishlistPage from "./pages/WishlistPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderConfirmationPage from "./pages/OrderConfirmationPage";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function CatalogRoute() {
  const { cart, addToCart, wishlist, toggleWishlist } = useCart();
  const navigate = useNavigate();

  return (
    <CatalogPage
      cartItems={cart}
      onAddToCart={addToCart}
      wishlistIds={wishlist}
      onToggleWishlist={toggleWishlist}
      onOpenProduct={(p) => navigate(`/product/${p.id}`)}
      headerActions={<HeaderActions />}
    />
  );
}

function GlobalCartDrawer() {
  const { cart, closeCart } = useCart();
  const navigate = useNavigate();

  return (
    <CartDrawer
      onCheckout={() => {
        closeCart();
        navigate("/checkout");
      }}
      onContinueShopping={() => {
        if (cart.length === 0) navigate("/shop");
      }}
    />
  );
}

function NotFound() {
  useDocumentTitle("الصفحة غير موجودة | Velora");
  return (
    <PageShell>
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <h1 className="text-2xl font-bold">الصفحة غير موجودة</h1>

        <Link
          to="/"
          className="flex h-12 items-center rounded-full bg-[#4A2C3A] px-8 text-sm font-bold text-white hover:bg-[#C2557A]"
        >
          العودة للرئيسية
        </Link>
      </div>
    </PageShell>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <ScrollToTop />

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<CatalogRoute />} />

          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order/:orderId" element={<OrderConfirmationPage />} />

          <Route path="*" element={<NotFound />} />
        </Routes>

        <GlobalCartDrawer />
        <WhatsAppButton />
      </CartProvider>
    </BrowserRouter>
  );
}