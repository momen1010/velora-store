// ثوابت لوحة الأدمن. الانتقالات هنا لازم تطابق okTransition في firestore.rules.
export const STATUSES = {
  pending: { label: "قيد المراجعة", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  confirmed: { label: "مؤكد", cls: "bg-sky-50 text-sky-700 ring-sky-200" },
  preparing: { label: "قيد التجهيز", cls: "bg-indigo-50 text-indigo-700 ring-indigo-200" },
  ready: { label: "جاهز", cls: "bg-violet-50 text-violet-700 ring-violet-200" },
  out_for_delivery: { label: "في الطريق", cls: "bg-orange-50 text-orange-700 ring-orange-200" },
  delivered: { label: "تم التسليم", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  cancelled: { label: "ملغي", cls: "bg-rose-50 text-rose-700 ring-rose-200" },
};
export const NEXT_STATUS = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["out_for_delivery", "cancelled"],
  out_for_delivery: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};
export const PAYMENT_STATUSES = { unpaid: "غير مدفوع", paid: "مدفوع", refunded: "تم الاسترجاع" };
export const PAYMENT_METHODS = { cod: "الدفع عند الاستلام", wallet: "محفظة إلكترونية" };
export const ROLES = { owner: "المالك", manager: "مدير", staff: "موظف" };
export const PERMS = {
  orders: ["owner", "manager", "staff"],
  products: ["owner", "manager"],
  categories: ["owner", "manager"],
  inventory: ["owner", "manager", "staff"],
  promotions: ["owner", "manager"],
  settings: ["owner"],
  customers: ["owner", "manager", "staff"],
};
export const CATEGORY_FALLBACK = [
  { id: "skincare", name: "العناية بالبشرة" }, { id: "makeup", name: "المكياج" },
  { id: "bags", name: "الشنط" }, { id: "shoes", name: "الأحذية" },
];
