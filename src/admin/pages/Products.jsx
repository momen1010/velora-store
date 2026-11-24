import { useMemo, useRef, useState } from "react";
import { doc, serverTimestamp } from "firebase/firestore";
import { Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import { db } from "../../firebase/config";
import { useAdminData } from "../DataContext";
import { Card, Confirm, Empty, ErrorState, Field, Modal, TableSkeleton, btnGhost, btnPrimary, inputCls, money, useToast } from "../components/ui";
import { commitLogged, errMsg, newId } from "../lib/adminWrite";
import { compressImage } from "../lib/image";
import { CATEGORY_FALLBACK } from "../lib/constants";

const BLANK = { name: "", nameEn: "", brand: "", description: "", category: "", price: "", salePrice: "", stock: 0, sku: "", trackStock: true, lowStockThreshold: 5, active: true, featured: false, images: [], shades: [], sizes: [] };
const clean = (s) => String(s ?? "").replace(/[<>]/g, "").trim();

function ProductForm({ product, categories, onClose }) {
  const toast = useToast();
  const [f, setF] = useState(() => ({ ...BLANK, category: categories[0]?.id ?? "", ...product, price: product?.price ?? "", salePrice: product?.salePrice ?? "", sizes: product?.sizes ?? [], shades: product?.shades ?? [] }));
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState("");
  const [err, setErr] = useState("");
  const fileRef = useRef(null);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const addFile = async (e) => {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    try { const data = await compressImage(file); setF((p) => ({ ...p, images: [...p.images, data].slice(0, 6) })); } catch (x) { setErr(x.message); }
  };
  const addUrl = () => {
    if (!/^(https:\/\/|\/images\/)[^\s<>"']{3,280}$/.test(url.trim())) { setErr("الرابط لازم يبدأ بـ https://"); return; }
    setF((p) => ({ ...p, images: [...p.images, url.trim()].slice(0, 6) })); setUrl(""); setErr("");
  };

  const save = async (e) => {
    e.preventDefault(); setErr("");
    const price = Number(f.price); const sale = f.salePrice === "" ? null : Number(f.salePrice);
    const stock = Math.trunc(Number(f.stock));
    if (!clean(f.name)) return setErr("اسم المنتج مطلوب");
    if (!f.category) return setErr("اختر القسم");
    if (!(price > 0)) return setErr("السعر لازم يكون أكبر من صفر");
    if (sale !== null && !(sale > 0 && sale < price)) return setErr("سعر الخصم لازم يكون أقل من السعر الأصلي");
    if (!Number.isFinite(stock) || stock < 0) return setErr("المخزون لا يمكن أن يكون سالباً");
    setBusy(true);
    const id = product?.id ?? newId("products");
    const first = f.images[0] ?? "";
    const data = {
      name: clean(f.name), nameEn: clean(f.nameEn), brand: clean(f.brand), category: f.category,
      description: clean(f.description).slice(0, 3000), price, salePrice: sale, stock,
      sku: clean(f.sku).slice(0, 40), trackStock: f.trackStock, lowStockThreshold: Math.max(0, Math.trunc(Number(f.lowStockThreshold) || 0)),
      active: f.active, featured: f.featured, images: f.images, image: first.length <= 300 ? first : "",
      shades: f.shades, sizes: f.sizes, skinType: f.skinType ?? [], ingredients: f.ingredients ?? "", usage: f.usage ?? "",
      badge: f.badge ?? null, rating: f.rating ?? 4.5, reviews: f.reviews ?? 0, sort: f.sort ?? 999,
    };
    try {
      await commitLogged(product ? "product.update" : "product.create", "products", id, { name: data.name, price, sale }, (b, logId) => {
        const ref = doc(db, "products", id);
        const full = { ...data, lastLogId: logId, updatedAt: serverTimestamp() };
        if (product) b.set(ref, { ...full, createdAt: product.createdAt });
        else b.set(ref, { ...full, createdAt: serverTimestamp() });
      });
      toast(product ? "تم حفظ المنتج" : "تمت إضافة المنتج"); onClose();
    } catch (x) { setErr(errMsg(x)); } finally { setBusy(false); }
  };

  return (
    <Modal open title={product ? "تعديل منتج" : "منتج جديد"} onClose={onClose} wide>
      <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
        <Field label="الاسم *"><input className={inputCls} value={f.name} onChange={set("name")} maxLength={200} /></Field>
        <Field label="الاسم بالإنجليزي"><input className={inputCls} dir="ltr" value={f.nameEn} onChange={set("nameEn")} maxLength={200} /></Field>
        <Field label="الماركة"><input className={inputCls} value={f.brand} onChange={set("brand")} maxLength={80} /></Field>
        <Field label="القسم *"><select className={inputCls} value={f.category} onChange={set("category")}>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <Field label="السعر الأصلي (ج.م) *"><input className={inputCls} type="number" min="0" step="0.01" value={f.price} onChange={set("price")} /></Field>
        <Field label="سعر الخصم (اختياري)"><input className={inputCls} type="number" min="0" step="0.01" value={f.salePrice} onChange={set("salePrice")} /></Field>
        <Field label="المخزون"><input className={inputCls} type="number" min="0" step="1" value={f.stock} onChange={set("stock")} /></Field>
        <Field label="رمز المنتج SKU"><input className={inputCls} dir="ltr" value={f.sku} onChange={set("sku")} maxLength={40} /></Field>
        <Field label="حد التنبيه (مخزون منخفض)"><input className={inputCls} type="number" min="0" value={f.lowStockThreshold} onChange={set("lowStockThreshold")} /></Field>
        <div className="flex flex-wrap items-center gap-4 pt-6 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={f.trackStock} onChange={set("trackStock")} />تتبّع المخزون</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={f.active} onChange={set("active")} />ظاهر في المتجر</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={f.featured} onChange={set("featured")} />مميّز</label>
        </div>
        <div className="sm:col-span-2"><Field label="الوصف"><textarea className={`${inputCls} h-24 py-2`} value={f.description} onChange={set("description")} maxLength={3000} /></Field></div>
        <div className="sm:col-span-2">
          <p className="mb-1 text-sm font-medium">الصور (أول صورة هي الرئيسية)</p>
          <div className="flex flex-wrap gap-2">
            {f.images.map((src, i) => (
              <div key={i} className="relative h-20 w-16 overflow-hidden rounded-lg border border-stone-200"><img src={src} alt="" className="h-full w-full object-cover" />
                <button type="button" aria-label="حذف الصورة" onClick={() => setF((p) => ({ ...p, images: p.images.filter((_, j) => j !== i) }))} className="absolute end-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"><X className="h-3 w-3" /></button></div>
            ))}
            <button type="button" onClick={() => fileRef.current?.click()} className="flex h-20 w-16 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-stone-300 text-xs text-stone-500 hover:bg-stone-50"><Upload className="h-4 w-4" />رفع</button>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={addFile} />
          </div>
          <div className="mt-2 flex gap-2"><input className={inputCls} dir="ltr" placeholder="أو الصق رابط صورة https://..." value={url} onChange={(e) => setUrl(e.target.value)} /><button type="button" className={btnGhost} onClick={addUrl}>إضافة</button></div>
        </div>
        {err && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 sm:col-span-2">{err}</p>}
        <div className="flex justify-end gap-2 sm:col-span-2"><button type="button" className={btnGhost} onClick={onClose}>إلغاء</button><button disabled={busy} className={btnPrimary}>{busy ? "جارٍ الحفظ..." : "حفظ"}</button></div>
      </form>
    </Modal>
  );
}

export default function Products() {
  const { products, categories } = useAdminData();
  const toast = useToast();
  const [q, setQ] = useState(""); const [cat, setCat] = useState("all"); const [stockF, setStockF] = useState("all");
  const [sel, setSel] = useState(new Set()); const [edit, setEdit] = useState(null); const [del, setDel] = useState(null); const [busy, setBusy] = useState(false);
  const cats = categories.rows.length ? categories.rows.map((c) => ({ id: c.id, name: c.name })) : CATEGORY_FALLBACK;
  const catName = (id) => cats.find((c) => c.id === id)?.name ?? id;

  const list = useMemo(() => products.rows.filter((p) => {
    if (q && !`${p.name} ${p.nameEn ?? ""} ${p.sku ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (cat !== "all" && p.category !== cat) return false;
    if (stockF === "out" && !(p.trackStock && p.stock === 0)) return false;
    if (stockF === "low" && !(p.trackStock && p.stock > 0 && p.stock <= (p.lowStockThreshold ?? 5))) return false;
    if (stockF === "in" && p.trackStock && p.stock === 0) return false;
    return true;
  }).sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0)), [products.rows, q, cat, stockF]);

  const bulk = async (kind) => {
    setBusy(true);
    try {
      const ids = [...sel];
      await commitLogged(`product.bulk.${kind}`, "products", ids.join(",").slice(0, 200), { count: ids.length }, (b, logId) => {
        for (const id of ids) {
          const p = products.rows.find((x) => x.id === id); if (!p) continue;
          const { id: _omit, ...rest } = p; void _omit;
          if (kind === "delete") b.delete(doc(db, "products", id));
          else b.set(doc(db, "products", id), { ...rest, active: kind === "enable", lastLogId: logId, updatedAt: serverTimestamp() });
        }
      });
      toast("تم تنفيذ الإجراء"); setSel(new Set());
    } catch (e) { toast(errMsg(e), "err"); } finally { setBusy(false); setDel(null); }
  };
  const allOn = list.length > 0 && list.every((p) => sel.has(p.id));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-xl font-bold">المنتجات</h1><button className={btnPrimary} onClick={() => setEdit({})}><Plus className="h-4 w-4" />منتج جديد</button></div>
      <Card>
        <div className="grid gap-3 border-b border-stone-100 p-4 sm:grid-cols-3">
          <input className={inputCls} placeholder="بحث بالاسم أو SKU" value={q} onChange={(e) => setQ(e.target.value)} aria-label="بحث" />
          <select className={inputCls} value={cat} onChange={(e) => setCat(e.target.value)} aria-label="القسم"><option value="all">كل الأقسام</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <select className={inputCls} value={stockF} onChange={(e) => setStockF(e.target.value)} aria-label="المخزون"><option value="all">كل المخزون</option><option value="in">متوفر</option><option value="low">منخفض</option><option value="out">نفد</option></select>
        </div>
        {sel.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 bg-stone-50 px-4 py-2 text-sm"><b>{sel.size} محدد</b>
            <button disabled={busy} className={btnGhost} onClick={() => bulk("enable")}>إظهار</button><button disabled={busy} className={btnGhost} onClick={() => bulk("disable")}>إخفاء</button>
            <button disabled={busy} className="inline-flex h-10 items-center rounded-lg bg-rose-50 px-4 text-sm font-bold text-rose-700" onClick={() => setDel("bulk")}>حذف</button></div>)}
        {products.error && <ErrorState message={products.error} />}
        {products.loading ? <TableSkeleton /> : list.length === 0 ? <Empty title="لا توجد منتجات" /> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm">
            <thead className="bg-stone-50 text-xs text-stone-500"><tr><th className="w-10 px-3 py-2"><input type="checkbox" aria-label="تحديد الكل" checked={allOn} onChange={() => setSel(allOn ? new Set() : new Set(list.map((p) => p.id)))} /></th>{["المنتج", "القسم", "السعر", "المخزون", "الحالة", ""].map((h) => <th key={h} className="px-3 py-2 text-start font-medium">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-stone-100">{list.map((p) => (
              <tr key={p.id} className="hover:bg-stone-50">
                <td className="px-3 py-2"><input type="checkbox" aria-label="تحديد" checked={sel.has(p.id)} onChange={() => setSel((s) => { const n = new Set(s); n.has(p.id) ? n.delete(p.id) : n.add(p.id); return n; })} /></td>
                <td className="px-3 py-2"><div className="flex items-center gap-3"><img src={(p.images && p.images[0]) || p.image} alt="" className="h-12 w-10 rounded-md object-cover bg-stone-100" loading="lazy" /><div><div className="font-medium">{p.name}</div><div className="text-xs text-stone-400">{p.sku}</div></div></div></td>
                <td className="px-3 py-2">{catName(p.category)}</td>
                <td className="px-3 py-2">{p.salePrice ? <><b>{money(p.salePrice)}</b> <s className="text-xs text-stone-400">{money(p.price)}</s></> : money(p.price)}</td>
                <td className="px-3 py-2">{p.trackStock ? <span className={p.stock === 0 ? "font-bold text-rose-600" : p.stock <= (p.lowStockThreshold ?? 5) ? "font-bold text-amber-600" : ""}>{p.stock}</span> : <span className="text-stone-400">غير متتبَّع</span>}</td>
                <td className="px-3 py-2"><span className={`rounded-full px-2 py-0.5 text-xs ${p.active ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-500"}`}>{p.active ? "ظاهر" : "مخفي"}</span>{p.featured && <span className="ms-1 rounded-full bg-pink-50 px-2 py-0.5 text-xs text-pink-700">مميّز</span>}</td>
                <td className="px-3 py-2 whitespace-nowrap"><button aria-label="تعديل" onClick={() => setEdit(p)} className="rounded-lg p-2 text-stone-500 hover:bg-stone-100"><Pencil className="h-4 w-4" /></button><button aria-label="حذف" onClick={() => setDel(p)} className="rounded-lg p-2 text-rose-500 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button></td>
              </tr>))}</tbody></table></div>)}
      </Card>
      {edit && <ProductForm product={edit.id ? edit : null} categories={cats} onClose={() => setEdit(null)} />}
      <Confirm open={Boolean(del)} danger busy={busy} title="حذف" confirmLabel="حذف نهائي"
        message={del === "bulk" ? `حذف ${sel.size} منتج نهائياً؟ الطلبات القديمة تحتفظ بنسخة من بيانات المنتج.` : `حذف "${del?.name}" نهائياً؟ الطلبات القديمة تحتفظ بنسخة من بياناته. لو عايز تخفيه فقط استخدم "إخفاء".`}
        onCancel={() => setDel(null)}
        onConfirm={async () => { if (del === "bulk") return bulk("delete"); setBusy(true); try { await commitLogged("product.delete", "products", del.id, { name: del.name }, (b) => b.delete(doc(db, "products", del.id))); toast("تم الحذف"); } catch (e) { toast(errMsg(e), "err"); } finally { setBusy(false); setDel(null); } }} />
    </div>
  );
}
