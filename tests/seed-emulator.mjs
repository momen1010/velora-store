// يملأ المحاكي ببيانات اختبار (يُستخدم لاختبار لوحة الأدمن محلياً فقط)
import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import fs from "fs";
import { mockProducts } from "../src/components/catalog/mockProducts.js";
import { staticToDoc } from "../src/data/productModel.js";
const env = await initializeTestEnvironment({ projectId: "demo-velora", firestore: { rules: fs.readFileSync(new URL("../firestore.rules", import.meta.url), "utf8"), host: "127.0.0.1", port: 8099 } });
const r = await fetch("http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=x", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: "owner@test.com", password: "Test-pass-123" }) });
let { localId } = await r.json();
if (!localId) {
  const l = await fetch("http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=x", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: "owner@test.com", password: "Test-pass-123", returnSecureToken: true }) });
  localId = (await l.json()).localId;
}
const r2 = await fetch("http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=x", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: "nobody@test.com", password: "Test-pass-123" }) });
await r2.json();
await env.withSecurityRulesDisabled(async (c) => {
  const db = c.firestore(); const now = new Date();
  await setDoc(doc(db, "admins", localId), { email: "owner@test.com", role: "owner", active: true, createdAt: now, updatedAt: now });
  for (const [i, p] of mockProducts.entries()) await setDoc(doc(db, "products", p.id), { ...staticToDoc(p, i), createdAt: now, updatedAt: now });
  for (const [i, [id, name]] of [["skincare", "العناية بالبشرة"], ["makeup", "المكياج"], ["bags", "الشنط"], ["shoes", "الأحذية"]].entries()) await setDoc(doc(db, "categories", id), { name, description: "", image: "", visible: true, sort: i, createdAt: now, updatedAt: now });
  await setDoc(doc(db, "storeSettings", "main"), { storeName: "Velora", shippingFee: 50, freeShippingThreshold: 799, minOrderAmount: 0, paymentMethods: { cod: true, wallet: true }, social: {}, updatedAt: now });
  await setDoc(doc(db, "promotions", "WELCOME10"), { type: "percent", value: 10, minOrder: 100, usageLimit: 50, usedCount: 0, active: true, expiresAt: null, createdAt: now, updatedAt: now });
  const names = ["منى أحمد", "سارة علي", "هدى محمود", "ياسمين خالد"]; const st = ["pending", "pending", "delivered", "cancelled", "confirmed", "delivered", "pending"];
  for (let k = 0; k < 7; k++) {
    const p = mockProducts[k]; const qty = 1 + (k % 3); const sub = p.price * qty; const ship = sub >= 799 ? 0 : 50;
    await setDoc(doc(db, "orders", `GLW-TEST00000${k}`), { paymentMethod: k % 2 ? "wallet" : "cod", ...(k % 2 ? { walletSender: "01112345678" } : {}), status: st[k], paymentStatus: st[k] === "delivered" ? "paid" : "unpaid",
      customer: { name: names[k % 4], phone: `0101234567${k % 4}`, governorate: "القاهرة", city: "مدينة نصر", address: "12 شارع التحرير، عمارة 4" },
      items: [{ cartItemId: `${p.id}__default`, id: p.id, name: p.name, brand: p.brand, image: p.image, price: p.price, shade: null, quantity: qty }], subtotal: sub, shipping: ship, total: sub + ship,
      createdAt: Timestamp.fromDate(new Date(Date.now() - k * 86400000 * 2)) });
  }
});
await env.cleanup(); console.log("seeded", localId);
