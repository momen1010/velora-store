// تحويل بين شكل المنتج في Firestore وشكل المنتج في واجهة المتجر.
// Firestore: price = السعر الأصلي، salePrice = سعر الخصم (أو null).
// الواجهة:  price = سعر البيع الحالي، oldPrice = السعر قبل الخصم (أو null).
export const DEFAULT_LOW_STOCK = 5;

export function docToStorefront(id, d) {
  const sale = d.salePrice ?? null;
  const price = sale != null ? sale : d.price;
  const oldPrice = sale != null ? d.price : null;
  return {
    id,
    name: d.name,
    nameEn: d.nameEn ?? "",
    brand: d.brand ?? "",
    category: d.category,
    skinType: d.skinType ?? [],
    price,
    oldPrice,
    discount: oldPrice ? Math.round((1 - price / oldPrice) * 100) : null,
    rating: d.rating ?? 4.5,
    reviews: d.reviews ?? 0,
    badge: d.badge ?? null,
    image: (d.images && d.images[0]) || d.image || "",
    images: d.images ?? [],
    shades: d.shades ?? [],
    sizes: d.sizes ?? [],
    description: d.description ?? "",
    ingredients: d.ingredients ?? "",
    usage: d.usage ?? "",
    stock: d.stock ?? 0,
    trackStock: d.trackStock === true,
    featured: d.featured === true,
    sort: d.sort ?? 0,
  };
}

// يُستخدم عند الـ seed: المنتج الثابت (price = سعر البيع، oldPrice = قبل الخصم)
export function staticToDoc(p, index) {
  const regular = p.oldPrice && p.oldPrice > p.price ? p.oldPrice : p.price;
  const sale = p.oldPrice && p.oldPrice > p.price ? p.price : null;
  return {
    name: p.name,
    nameEn: p.nameEn ?? "",
    brand: p.brand ?? "",
    category: p.category,
    skinType: p.skinType ?? [],
    price: regular,
    salePrice: sale,
    badge: p.badge ?? null,
    image: p.image,
    images: [p.image],
    shades: p.shades ?? [],
    sizes: p.sizes ?? [],
    description: p.description ?? "",
    ingredients: p.ingredients ?? "",
    usage: p.usage ?? "",
    sku: `VEL-${String(p.id).toUpperCase()}`,
    stock: 20,
    trackStock: true,
    lowStockThreshold: DEFAULT_LOW_STOCK,
    active: true,
    featured: p.badge === "الأكثر مبيعاً",
    rating: p.rating ?? 4.5,
    reviews: p.reviews ?? 0,
    sort: index,
  };
}
