// src/context/StoreContext.jsx
import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import {
  loadCart, saveCart, loadWishlist, saveWishlist,
  safeRead, safeWrite,
} from '../utils/storage';
import {
  isValidProduct, sanitizeNumber, sanitizeText, isValidHex,
} from '../utils/sanitize';

const StoreContext = createContext(null);

export const FREE_SHIPPING_THRESHOLD = 500; // عدّلها حسب السوق
export const MAX_QTY_PER_ITEM = 99;

// ─── Reducer ──────────────────────────────────────────────
const initialState = {
  cart: [],
  wishlist: [],
  isCartOpen: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'INIT': {
      return { ...state, ...action.payload };
    }
    case 'ADD_TO_CART': {
      
      const { product, quantity = 1, shade = null, size = null } = action.payload;
      if (!isValidProduct(product)) return state;

      const qty = sanitizeNumber(quantity, { min: 1, max: MAX_QTY_PER_ITEM, fallback: 1 });
      const safeShade = shade && isValidHex(shade.hex)
        ? { name: sanitizeText(shade.name), hex: shade.hex }
        : null;

      const key = `${product.id}::${shade?.hex ?? ''}::${size ?? ''}`;
      const existing = state.cart.find(
        (i) => `${i.product.id}::${i.shade?.hex ?? ''}` === key
      );

      if (existing) {
        return {
          ...state,
          cart: state.cart.map((i) =>
            `${i.product.id}::${i.shade?.hex ?? ''}` === key
              ? { ...i, quantity: Math.min(i.quantity + qty, MAX_QTY_PER_ITEM) }
              : i
          ),
        };
      }

      return {
        ...state,
        cart: [...state.cart, { product, quantity: qty, shade: safeShade }],
      };
    }
    case 'REMOVE_FROM_CART': {
      const { productId, shadeHex = null } = action.payload;
      return {
        ...state,
        cart: state.cart.filter(
          (i) => !(i.product.id === productId && (i.shade?.hex ?? null) === shadeHex)
        ),
      };
    }
    case 'UPDATE_QUANTITY': {
      const { productId, shadeHex = null, quantity } = action.payload;
      const qty = sanitizeNumber(quantity, { min: 0, max: MAX_QTY_PER_ITEM, fallback: 0 });
      if (qty === 0) {
        return {
          ...state,
          cart: state.cart.filter(
            (i) => !(i.product.id === productId && (i.shade?.hex ?? null) === shadeHex)
          ),
        };
      }
      return {
        ...state,
        cart: state.cart.map((i) =>
          i.product.id === productId && (i.shade?.hex ?? null) === shadeHex
            ? { ...i, quantity: qty }
            : i
        ),
      };
    }
    case 'CLEAR_CART':
      return { ...state, cart: [] };
    case 'TOGGLE_WISHLIST': {
      const { product } = action.payload;
      if (!isValidProduct(product)) return state;
      const exists = state.wishlist.some((p) => p.id === product.id);
      return {
        ...state,
        wishlist: exists
          ? state.wishlist.filter((p) => p.id !== product.id)
          : [...state.wishlist, product],
      };
    }
    case 'REMOVE_FROM_WISHLIST':
      return {
        ...state,
        wishlist: state.wishlist.filter((p) => p.id !== action.payload.productId),
      };
    case 'CLEAR_WISHLIST':
      return { ...state, wishlist: [] };
    case 'TOGGLE_CART_DRAWER':
      return { ...state, isCartOpen: action.payload ?? !state.isCartOpen };
    default:
      return state;
  }
}

// ─── Provider ─────────────────────────────────────────────
export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // تحميل آمن من التخزين عند التهيئة
  useEffect(() => {
    dispatch({
      type: 'INIT',
      payload: { cart: loadCart(), wishlist: loadWishlist() },
    });
  }, []);

  // حفظ تلقائي آمن عند أي تغيير
  useEffect(() => { saveCart(state.cart); }, [state.cart]);
  useEffect(() => { saveWishlist(state.wishlist); }, [state.wishlist]);

  // ─── Public API ────────────────────────────────────────
  const api = useMemo(() => {
    const addToCart = (product, quantity = 1, shade = null) =>
      dispatch({ type: 'ADD_TO_CART', payload: { product, quantity, shade } });

    const removeFromCart = (productId, shadeHex = null) =>
      dispatch({ type: 'REMOVE_FROM_CART', payload: { productId, shadeHex } });

    const updateQuantity = (productId, shadeHex, quantity) =>
      dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, shadeHex, quantity } });

    const clearCart = () => dispatch({ type: 'CLEAR_CART' });

    const toggleWishlist = (product) =>
      dispatch({ type: 'TOGGLE_WISHLIST', payload: { product } });

    const removeFromWishlist = (productId) =>
      dispatch({ type: 'REMOVE_FROM_WISHLIST', payload: { productId } });

    const isInWishlist = (productId) =>
      state.wishlist.some((p) => p.id === productId);

    const openCart = () => dispatch({ type: 'TOGGLE_CART_DRAWER', payload: true });
    const closeCart = () => dispatch({ type: 'TOGGLE_CART_DRAWER', payload: false });

    /* ══════════════════════════════════════════════════════
       💵 COD — الدفع عند الاستلام
       ══════════════════════════════════════════════════════ */
    const placeCODOrder = async (customerInfo) => {
      // 1. التحقق من وجود بيانات
      if (!customerInfo || typeof customerInfo !== 'object') {
        throw new Error('بيانات العميل غير صالحة');
      }

      // 2. تعقيم المدخلات
      const safeName    = sanitizeText(customerInfo.name);
      const safePhone   = sanitizeText(customerInfo.phone).replace(/\D/g, ''); // أرقام فقط
      const safeAddress = sanitizeText(customerInfo.address);
      const safeNotes   = sanitizeText(customerInfo.notes ?? '');

      // 3. تحقق من اكتمال البيانات
      if (!safeName || safeName.length < 2) {
        throw new Error('الاسم مطلوب (حرفان على الأقل)');
      }
      if (!/^01[0-2,5]\d{8}$/.test(safePhone)) {
        throw new Error('رقم الهاتف غير صحيح (يجب أن يكون رقماً مصرياً)');
      }
      if (!safeAddress || safeAddress.length < 10) {
        throw new Error('العنوان مطلوب (10 أحرف على الأقل)');
      }

      // 4. التحقق من أن السلة ليست فارغة
      if (state.cart.length === 0) {
        throw new Error('السلة فارغة');
      }

      // 5. التحقق من صحة كل منتج في السلة (دفاع عميق)
      const invalidItem = state.cart.find((i) => !isValidProduct(i.product));
      if (invalidItem) {
        throw new Error('يوجد منتج غير صالح في السلة');
      }

      // 6. حساب الإجمالي من State الآمن (لا نثق بالواجهة)
      const total = state.cart.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
      );

      // 7. بناء كائن الطلب
      const order = {
        id: `COD-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        items: state.cart.map((item) => ({
          productId: item.product.id,
          name: sanitizeText(item.product.name),
          brand: sanitizeText(item.product.brand),
          category: item.product.category,
          quantity: item.quantity,
          shade: item.shade?.hex ?? null,
          shadeName: item.shade?.name ? sanitizeText(item.shade.name) : null,
          unitPrice: item.product.price,
          lineTotal: item.product.price * item.quantity,
        })),
        customer: {
          name: safeName,
          phone: safePhone,
          address: safeAddress,
          notes: safeNotes,
        },
        subtotal: total,
        shipping: total >= FREE_SHIPPING_THRESHOLD ? 0 : 60,
        total: total + (total >= FREE_SHIPPING_THRESHOLD ? 0 : 60),
        paymentMethod: 'COD',
        status: 'confirmed',
        paid: false,
        createdAt: new Date().toISOString(),
      };

      // 8. حفظ الطلب (مؤقتاً في LocalStorage — استبدلها بـ fetch لاحقاً)
      const existingOrders = safeRead('velora_orders', Array.isArray, []);
      safeWrite('velora_orders', [...existingOrders, order]);

      // 9. إفراغ السلة وإغلاق الدرج
      dispatch({ type: 'CLEAR_CART' });
      dispatch({ type: 'TOGGLE_CART_DRAWER', payload: false });

      // 10. إرجاع الطلب
      return order;
    };

    /* ══════════════════════════════════════════════════════
       📦 قراءة الطلبات (اختياري — للوحة الإدارة لاحقاً)
       ══════════════════════════════════════════════════════ */
    const getOrders = () => safeRead('velora_orders', Array.isArray, []);

    // مشتقات محسوبة
    const cartCount = state.cart.reduce((sum, i) => sum + i.quantity, 0);
    const cartSubtotal = state.cart.reduce(
      (sum, i) => sum + i.product.price * i.quantity, 0
    );
    const freeShippingRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - cartSubtotal);
    const freeShippingProgress = Math.min(
      100,
      Math.round((cartSubtotal / FREE_SHIPPING_THRESHOLD) * 100)
    );
    const qualifiedForFreeShipping = cartSubtotal >= FREE_SHIPPING_THRESHOLD;

    return {
      // state
      cart: state.cart,
      wishlist: state.wishlist,
      isCartOpen: state.isCartOpen,
      // cart actions
      addToCart, removeFromCart, updateQuantity, clearCart,
      // wishlist actions
      toggleWishlist, removeFromWishlist, isInWishlist,
      // UI actions
      openCart, closeCart,
      // COD
      placeCODOrder,
      getOrders,
      // derived
      cartCount, cartSubtotal, freeShippingRemaining,
      freeShippingProgress, qualifiedForFreeShipping,
    };
  }, [state]);

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────
export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within <StoreProvider>');
  return ctx;
}