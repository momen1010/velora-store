// src/utils/sanitize.js

/**
 * تعقيم النصوص من أي وسوم HTML أو أكواد خطيرة (XSS)
 */
export const sanitizeText = (input) => {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<[^>]*>/g, '')          // إزالة أي وسم HTML
    .replace(/[<>"'`]/g, '')         // إزالة الرموز الخطيرة
    .replace(/\s+/g, ' ')            // توحيد المسافات
    .trim()
    .slice(0, 200);                  // حد أقصى للطول
};

/**
 * تعقيم الأرقام (الأسعار والكميات)
 */
export const sanitizeNumber = (value, { min = 0, max = Number.MAX_SAFE_INTEGER, fallback = 0 } = {}) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(Math.max(num, min), max);
};

/**
 * التحقق من أن المنتج يطابق الـ Schema الموحد
 */
export const isValidProduct = (p) => {
  if (!p || typeof p !== 'object') return false;
  if (p.id == null || typeof p.name !== 'string') return false;
  if (!['skincare', 'makeup'].includes(p.category)) return false;
  if (typeof p.price !== 'number' || p.price < 0) return false;
  return true;
};

/**
 * التحقق من اللون HEX (لأمان حقن CSS)
 */
export const isValidHex = (hex) =>
  typeof hex === 'string' && /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex);

/**
 * تعقيم عنوان URL للصور (منع javascript: و data:)
 */
export const sanitizeImageUrl = (url) => {
  if (typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (/^(https?:\/\/|\/|\.\/)/i.test(trimmed)) return trimmed;
  return '';
};