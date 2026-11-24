// رفع صور آمن بدون Firebase Storage (يحتاج خطة Blaze): تحقق من النوع والحجم، ثم ضغط
// وتحويل إلى WebP عبر canvas (هذا يزيل أي محتوى غير صورة). الناتج data URL صغير يُحفظ في المنتج.
const OK = ["image/jpeg", "image/png", "image/webp"];
const MAX_INPUT = 6 * 1024 * 1024;
const MAX_OUT = 140 * 1024;

export async function compressImage(file, maxSide = 900) {
  if (!OK.includes(file.type)) throw new Error("نوع الصورة غير مدعوم (JPG أو PNG أو WebP فقط)");
  if (file.size > MAX_INPUT) throw new Error("حجم الصورة أكبر من 6 ميجا");
  const bmp = await createImageBitmap(file).catch(() => { throw new Error("الملف ليس صورة صالحة"); });
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
  c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
  for (const q of [0.82, 0.7, 0.58, 0.45]) {
    const blob = await new Promise((r) => c.toBlob(r, "image/webp", q));
    if (blob && blob.size <= MAX_OUT) {
      return new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = rej; fr.readAsDataURL(blob); });
    }
  }
  throw new Error("الصورة معقدة وحجمها كبير بعد الضغط. جرّب صورة أبسط أو أصغر.");
}
