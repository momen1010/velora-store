// src/components/catalog/catalogConfig.js
// كل النصوص والثوابت في مكان واحد لسهولة الترجمة أو التعديل.

export const CURRENCY = "ج.م";
export const LOCALE = "ar-EG";

export const formatPrice = (n, currency = CURRENCY) =>
  `${Number(n).toLocaleString(LOCALE)} ${currency}`;

// يعتمد على discount من الـ Schema، وإن كان null يحسبه من oldPrice
export const getDiscount = (p) =>
  p.discount ??
  (p.oldPrice && p.oldPrice > p.price
    ? Math.round((1 - p.price / p.oldPrice) * 100)
    : null);

export const CATEGORIES = [
  { id: "all", label: "الكل" },
  { id: "skincare", label: "العناية بالبشرة" },
  { id: "makeup", label: "المكياج" },
];

export const SKIN_LABELS = {
  dry: "جافة",
  oily: "دهنية",
  combination: "مختلطة",
  sensitive: "حساسة",
  normal: "عادية",
  all: "جميع الأنواع",
};

export const SORT_OPTIONS = [
  { id: "featured", label: "الأكثر رواجاً" },
  { id: "topRated", label: "الأعلى تقييماً" },
  { id: "discount", label: "أكبر خصم" },
  { id: "priceAsc", label: "السعر: الأقل أولاً" },
  { id: "priceDesc", label: "السعر: الأعلى أولاً" },
];

export const L = {
  brand: "velora",
  searchLabel: "البحث في المنتجات",
  searchPlaceholder: "ابحث عن منتج أو ماركة",
  clearSearch: "مسح البحث",
  filters: "تصفية",
  skinType: "نوع البشرة",
  price: "السعر",
  priceFrom: "من",
  priceTo: "إلى",
  sort: "ترتيب حسب",
  resetAll: "مسح كل التصفيات",
  showResults: (n) => `عرض ${n} منتج`,
  results: (n) => `${n} منتج`,
  close: "إغلاق",
  shades: "درجات اللون",
  shade: "الدرجة",
  moreShades: (n) => `عرض ${n} درجات إضافية`,
  addToCart: "أضف إلى السلة",
  addedToCart: "تمت الإضافة إلى السلة",
  addToWishlist: "أضف إلى المفضلة",
  removeFromWishlist: "أزل من المفضلة",
  inCart: (n) => `في السلة: ${n}`,
  emptyTitle: "لا توجد منتجات مطابقة",
  emptyBody: "جرّب كلمات بحث أخرى أو امسح التصفيات لعرض كل المنتجات.",
  reviews: "تقييم",
};
