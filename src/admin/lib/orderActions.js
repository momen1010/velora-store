// عمليات الطلبات الإدارية. كلها تمر بسجل تدقيق، وتغيير الحالة يتم في transaction:
//  - التأكيد يخصم المخزون (لو المنتج بتتبّع مخزون) ويرفض لو المخزون لا يكفي (لا مخزون سالب).
//  - الإلغاء بعد التأكيد يُرجع المخزون.
//  - أول تأكيد لطلب عليه كود خصم يزوّد عدّاد استخدام الكود.
// الدوال تأخذ db و user كمعاملات لتُختبر على المحاكي.
import { doc, runTransaction, serverTimestamp, Timestamp, collection, writeBatch } from "firebase/firestore";
import { NEXT_STATUS } from "./constants";

const lid = (db, col) => doc(collection(db, col)).id;

export async function changeOrderStatus(db, user, orderId, to, note = "") {
  return runTransaction(db, async (tx) => {
    const orderRef = doc(db, "orders", orderId);
    const snap = await tx.get(orderRef);
    if (!snap.exists()) throw new Error("الطلب غير موجود");
    const o = snap.data();
    if (!(NEXT_STATUS[o.status] ?? []).includes(to)) throw new Error("انتقال الحالة غير مسموح");

    // اجمع الكميات لكل منتج (نفس المنتج قد يظهر في أكثر من سطر)
    const qty = new Map();
    for (const i of o.items) qty.set(String(i.id), (qty.get(String(i.id)) ?? 0) + i.quantity);

    const deduct = to === "confirmed" && !o.stockDeducted;
    const restore = to === "cancelled" && o.stockDeducted === true;
    const countPromo = to === "confirmed" && o.promoCode && !o.promoCounted;

    // كل القراءات أولاً (شرط الـ transaction)
    const prods = new Map();
    if (deduct || restore) {
      for (const pid of qty.keys()) prods.set(pid, await tx.get(doc(db, "products", pid)));
    }
    const promoSnap = countPromo ? await tx.get(doc(db, "promotions", o.promoCode)) : null;

    const logId = lid(db, "adminLogs");
    const entry = { status: to, at: Timestamp.now(), by: user.email ?? user.uid, ...(note ? { note } : {}) };
    const orderUpdate = {
      status: to,
      statusHistory: [...(o.statusHistory ?? []), entry],
      lastLogId: logId, updatedAt: serverTimestamp(),
    };

    const stockWrites = [];
    if (deduct || restore) {
      for (const [pid, q] of qty) {
        const ps = prods.get(pid);
        if (!ps.exists()) continue;
        const p = ps.data();
        if (p.trackStock !== true) continue;
        const after = deduct ? p.stock - q : p.stock + q;
        if (after < 0) throw new Error(`المخزون لا يكفي للمنتج "${p.name}" (المتاح ${p.stock}، المطلوب ${q})`);
        stockWrites.push({ pid, p, q, after });
      }
      orderUpdate.stockDeducted = deduct;
    }
    if (countPromo) orderUpdate.promoCounted = true;

    tx.set(doc(db, "adminLogs", logId), {
      adminUid: user.uid, adminEmail: user.email ?? "", action: `order.status.${to}`, target: "orders", targetId: orderId,
      details: { from: o.status, to, stock: stockWrites.length }, createdAt: serverTimestamp(),
    });
    for (const w of stockWrites) {
      const invId = lid(db, "inventoryLogs");
      tx.set(doc(db, "inventoryLogs", invId), {
        productId: w.pid, productName: w.p.name, change: deduct ? -w.q : w.q, before: w.p.stock, after: w.after,
        reason: deduct ? "order_confirmed" : "order_cancelled", orderId, adminUid: user.uid, createdAt: serverTimestamp(),
      });
      tx.update(doc(db, "products", w.pid), { stock: w.after, lastLogId: invId, updatedAt: serverTimestamp() });
    }
    if (promoSnap?.exists()) {
      tx.update(promoSnap.ref, { usedCount: (promoSnap.data().usedCount ?? 0) + 1, lastLogId: logId, updatedAt: serverTimestamp() });
    }
    tx.update(orderRef, orderUpdate);
  });
}

// حالة الدفع والملاحظات الداخلية (لا تغيّر الحالة ولا المبالغ)
export async function updateOrderMeta(db, user, order, patch) {
  const batch = writeBatch(db);
  const logId = lid(db, "adminLogs");
  batch.set(doc(db, "adminLogs", logId), {
    adminUid: user.uid, adminEmail: user.email ?? "", action: "order.update", target: "orders", targetId: order.id,
    details: Object.fromEntries(Object.keys(patch).map((k) => [k, k === "internalNotes" ? "(updated)" : String(patch[k])])), createdAt: serverTimestamp(),
  });
  batch.update(doc(db, "orders", order.id), { ...patch, lastLogId: logId, updatedAt: serverTimestamp() });
  await batch.commit();
}
