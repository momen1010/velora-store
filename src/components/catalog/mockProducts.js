// src/components/catalog/mockProducts.js
// بيانات تجريبية مطابقة للـ Global Product JSON Schema.
// إن لم توجد الصورة يعرض الكارت تدرجاً لونياً بديلاً تلقائياً.

// امتداد ملفات الصور: "svg" للرسومات المؤقتة. غيّره إلى "jpg" أو "webp" عند وضع صورك الحقيقية
// (بنفس الأسماء داخل public/images/products/).
const IMG_EXT = "svg";
const img = (slug) => `/images/products/${slug}.${IMG_EXT}`;

export const mockProducts = [
  { id: 1, name: "Velvet Matte Lip Cream", brand: "Rosé Atelier", category: "makeup", skinType: ["all"], price: 320, oldPrice: 400, discount: 20, rating: 4.7, reviews: 842, badge: "الأكثر مبيعاً", image: img("velvet-lip"),
    shades: [{ name: "Rose Petal", hex: "#D9728F" }, { name: "Nude Silk", hex: "#C98F7E" }, { name: "Berry Kiss", hex: "#8E2F52" }, { name: "Coral Dew", hex: "#EE8B77" }, { name: "Mauve Muse", hex: "#A66A7E" }, { name: "Cherry Noir", hex: "#6B1B33" }] },
  { id: 2, name: "Hydra Dew Gel Moisturizer", brand: "Lumière", category: "skincare", skinType: ["dry", "normal"], price: 540, oldPrice: null, discount: null, rating: 4.8, reviews: 1290, badge: "جديد", image: img("hydra-dew"), shades: [] },
  { id: 3, name: "Soft Focus Cushion Foundation", brand: "velora Studio", category: "makeup", skinType: ["combination", "normal"], price: 690, oldPrice: 820, discount: 16, rating: 4.5, reviews: 516, badge: null, image: img("cushion"),
    shades: [{ name: "Porcelain", hex: "#F4DCCB" }, { name: "Ivory", hex: "#EBC9AE" }, { name: "Beige", hex: "#DDB28F" }, { name: "Honey", hex: "#C4906B" }, { name: "Caramel", hex: "#9C6A47" }] },
  { id: 4, name: "Vitamin C Brightening Serum", brand: "Lumière", category: "skincare", skinType: ["normal", "combination", "oily"], price: 780, oldPrice: 950, discount: 18, rating: 4.9, reviews: 2104, badge: "الأكثر مبيعاً", image: img("vitamin-c"), shades: [] },
  { id: 5, name: "Petal Blush Duo", brand: "Rosé Atelier", category: "makeup", skinType: ["all"], price: 410, oldPrice: null, discount: null, rating: 4.6, reviews: 377, badge: null, image: img("petal-blush"),
    shades: [{ name: "Peony", hex: "#F2A7B8" }, { name: "Apricot", hex: "#F4B08C" }, { name: "Dusty Rose", hex: "#C9808F" }] },
  { id: 6, name: "Gentle Foam Cleanser", brand: "Pure Bloom", category: "skincare", skinType: ["sensitive", "dry"], price: 295, oldPrice: 350, discount: 16, rating: 4.4, reviews: 689, badge: null, image: img("foam-cleanser"), shades: [] },
  { id: 7, name: "Lash Lift Waterproof Mascara", brand: "velora Studio", category: "makeup", skinType: ["all"], price: 260, oldPrice: null, discount: null, rating: 4.3, reviews: 951, badge: null, image: img("mascara"),
    shades: [{ name: "Jet Black", hex: "#1D1417" }, { name: "Espresso", hex: "#3E2A25" }] },
  { id: 8, name: "Ceramide Barrier Repair Cream", brand: "Pure Bloom", category: "skincare", skinType: ["sensitive", "dry"], price: 620, oldPrice: 720, discount: 14, rating: 4.8, reviews: 1543, badge: "اختيار الخبراء", image: img("ceramide"), shades: [] },
  { id: 9, name: "Glass Gloss Lip Oil", brand: "Rosé Atelier", category: "makeup", skinType: ["all"], price: 225, oldPrice: 280, discount: 20, rating: 4.6, reviews: 1120, badge: "عرض محدود", image: img("lip-oil"),
    shades: [{ name: "Clear", hex: "#F7DDE3" }, { name: "Cherry", hex: "#C63D5E" }, { name: "Peach", hex: "#F3A98B" }, { name: "Plum", hex: "#7E3556" }] },
  { id: 10, name: "Oil Control Clay Mask", brand: "Pure Bloom", category: "skincare", skinType: ["oily", "combination"], price: 340, oldPrice: null, discount: null, rating: 4.2, reviews: 274, badge: null, image: img("clay-mask"), shades: [] },
  { id: 11, name: "Satin Finish Eyeshadow Palette", brand: "velora Studio", category: "makeup", skinType: ["all"], price: 880, oldPrice: 1100, discount: 20, rating: 4.7, reviews: 438, badge: "جديد", image: img("palette"),
    shades: [{ name: "Rosewood", hex: "#B7707A" }, { name: "Champagne", hex: "#E6C8A8" }, { name: "Mocha", hex: "#7A5547" }, { name: "Mauve", hex: "#9B7488" }] },
  { id: 12, name: "Daily Sheer SPF 50 Sunscreen", brand: "Lumière", category: "skincare", skinType: ["all"], price: 450, oldPrice: null, discount: null, rating: 4.9, reviews: 3012, badge: "الأكثر مبيعاً", image: img("spf50"), shades: [] },

{
  id: "hc-001",
  name: "Silk Repair Shampoo",
  brand: "velora Hair",
  category: "haircare",
  skinType: ["all"],
  price: 320,
  oldPrice: null,
  discount: null,
  rating: 4.6,
  reviews: 184,
  badge: null,
  image: "/images/products/silk-shampoo.svg",
  shades: [],
},
{
  id: "fr-001",
  name: "Rose Bloom Eau de Parfum",
  brand: "velora Fragrance",
  category: "fragrance",
  skinType: ["all"],
  price: 890,
  oldPrice: 1100,
  discount: 19,
  rating: 4.8,
  reviews: 342,
  badge: "الأكثر مبيعاً",
  image: "/images/products/rose-parfum.svg",
  shades: [],
},
{
  id: "bd-001",
  name: "Glow Ritual Bundle",
  brand: "velora",
  category: "bundle",
  skinType: ["all"],
  price: 1450,
  oldPrice: 1900,
  discount: 24,
  rating: 4.9,
  reviews: 128,
  badge: null,
  image: "/images/products/glow-bundle.svg",
  shades: [],
},

];



export default mockProducts;