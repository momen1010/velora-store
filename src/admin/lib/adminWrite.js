// كتابة إدارية مع سجل تدقيق إجباري: كل تعديل يمر عبر batch يحتوي مستند adminLogs
// والقواعد ترفض التعديل لو لم يوجد السجل (existsAfter).
import { doc, serverTimestamp, writeBatch, collection } from "firebase/firestore";
import { auth, db } from "../../firebase/config";

export const newId = (col) => doc(collection(db, col)).id;

export async function commitLogged(action, target, targetId, details, build) {
  const user = auth?.currentUser;
  if (!user) throw new Error("انتهت الجلسة، سجّل الدخول مرة أخرى");
  const batch = writeBatch(db);
  const logId = newId("adminLogs");
  batch.set(doc(db, "adminLogs", logId), {
    adminUid: user.uid, adminEmail: user.email ?? "", action, target, targetId: String(targetId),
    details: details ?? {}, createdAt: serverTimestamp(),
  });
  build(batch, logId);
  await batch.commit();
}

export const ts = () => serverTimestamp();

export const errMsg = (e) => {
  const c = e?.code ?? "";
  if (c.includes("permission-denied")) return "ليس لديك صلاحية لهذا الإجراء (أو البيانات غير صالحة).";
  if (c.includes("unauthenticated")) return "انتهت الجلسة، سجّل الدخول مرة أخرى.";
  if (c.includes("unavailable") || c.includes("network")) return "مشكلة في الاتصال. حاول مرة أخرى.";
  return e?.message || "حدث خطأ غير متوقع.";
};
