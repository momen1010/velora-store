// يملأ Firestore بالبيانات الأولية (المنتجات الـ28 + الأقسام + الإعدادات).
// يستخدم Admin REST (يتجاوز القواعد) بتوكن وصول: ACCESS_TOKEN=... node scripts/seed.mjs
// آمن للتكرار: ينشئ فقط ما هو غير موجود ولا يكتب فوق بيانات موجودة.
import { mockProducts } from "../src/components/catalog/mockProducts.js";
import { staticToDoc } from "../src/data/productModel.js";

const PROJECT = process.env.PROJECT_ID || "velora-10";
const TOKEN = process.env.ACCESS_TOKEN;
if (!TOKEN) throw new Error("ACCESS_TOKEN مطلوب");
const base = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;

const val = (v) => {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === "string") return { stringValue: v };
  if (typeof v === "boolean") return { booleanValue: v };
  if (typeof v === "number") return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (v instanceof Date) return { timestampValue: v.toISOString() };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(val) } };
  return { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, val(x)])) } };
};

async function createIfMissing(path, data) {
  const [col, id] = [path.slice(0, path.lastIndexOf("/")), path.slice(path.lastIndexOf("/") + 1)];
  const res = await fetch(`${base}/${col}?documentId=${encodeURIComponent(id)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json", "x-goog-user-project": PROJECT },
    body: JSON.stringify({ fields: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, val(v)])) }),
  });
  if (res.status === 409) return "exists";
  if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`);
  return "created";
}

const now = new Date();
const counts = { created: 0, exists: 0 };
const run = async (path, data) => { counts[await createIfMissing(path, data)]++; };

for (const [i, p] of mockProducts.entries()) {
  await run(`products/${p.id}`, { ...staticToDoc(p, i), createdAt: now, updatedAt: now });
}
const cats = [
  ["skincare", "العناية بالبشرة"], ["makeup", "المكياج"], ["bags", "الشنط"], ["shoes", "الأحذية"],
];
for (const [i, [id, name]] of cats.entries()) {
  await run(`categories/${id}`, { name, description: "", image: "", visible: true, sort: i, createdAt: now, updatedAt: now });
}
await run("storeSettings/main", {
  storeName: "Velora", logo: "", phone: "", whatsapp: "", email: "", address: "",
  shippingFee: 50, freeShippingThreshold: 799, minOrderAmount: 0,
  hours: "", paymentMethods: { cod: true, wallet: true }, social: { instagram: "", facebook: "", tiktok: "" },
  updatedAt: now,
});
console.log(JSON.stringify(counts));
