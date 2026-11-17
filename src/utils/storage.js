// src/utils/storage.js
import { isValidProduct, sanitizeNumber, sanitizeText, isValidHex } from './sanitize';

const CART_KEY = 'velora_cart_v1';
const WISHLIST_KEY = 'velora_wishlist_v1';

/**
 * قراءة آمنة من LocalStorage مع التحقق الكامل
 */
export const safeRead = (key, validator, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return validator(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

/**
 * كتابة آمنة إلى LocalStorage
 */
export const safeWrite = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.warn('[velora Storage] Write failed:', err);
    return false;
  }
};

/**
 * التحقق من صحة عناصر السلة القادمة من التخزين
 */
const validateCartItem = (item) => {
  if (!isValidProduct(item?.product)) return false;
  const qty = sanitizeNumber(item.quantity, { min: 1, max: 99, fallback: 1 });
  return qty >= 1;
};

const validateWishlist = (arr) =>
  Array.isArray(arr) && arr.every((p) => isValidProduct(p));

/**
 * تحميل السلة بأمان من التخزين
 */
export const loadCart = () => {
  const raw = safeRead(CART_KEY, Array.isArray, []);
  return raw.filter(validateCartItem).map((item) => ({
    product: item.product,
    quantity: sanitizeNumber(item.quantity, { min: 1, max: 99, fallback: 1 }),
    shade: item.shade && isValidHex(item.shade.hex)
      ? { name: sanitizeText(item.shade.name), hex: item.shade.hex }
      : null,
  }));
};

export const saveCart = (cart) => safeWrite(CART_KEY, cart);

/**
 * تحميل قائمة المفضلة بأمان
 */
export const loadWishlist = () => {
  const raw = safeRead(WISHLIST_KEY, validateWishlist, []);
  return raw.filter(isValidProduct);
};

export const saveWishlist = (wishlist) => safeWrite(WISHLIST_KEY, wishlist);