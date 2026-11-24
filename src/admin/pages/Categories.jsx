import { useMemo, useRef, useState } from "react";
import { doc, serverTimestamp } from "firebase/firestore";
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { db } from "../../firebase/config";
import { useAdminData } from "../DataContext";
import { Card, Confirm, Empty, ErrorState, Field, Modal, TableSkeleton, btnGhost, btnPrimary, inputCls, useToast } from "../components/ui";
import { commitLogged, errMsg } from "../lib/adminWrite";
import { compressImage } from "../lib/image";

const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30);

function CatForm({ cat, nextSort, existingIds, onClose }) {
  const toast = useToast();
  const [f, setF] = useState({ id: cat?.id ?? "", name: cat?.name ?? "", description: cat?.description ?? "", image: cat?.image ?? "", visible: cat?.visible ?? true });
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false); const fr = useRef(null);
  const save = async (e) => {
    e.preventDefault(); setErr("");
    const name = f.name.replace(/[<>]/g, "").trim();
    if (!name) return setErr("اسم القسم مطلوب");
    const id = cat?.id ?? f.id.trim();
    if (!cat && (!/^[a-z0-9-]{2,30}$/.test(id) || existingIds.includes(id))) return setErr("المعرّف لازم يكون إنجليزي (حروف صغيرة وأرقام وشرطة) وغير مكرر");
    setBusy(true);
    try {
      await commitLogged(cat ? "category.update" : "category.create", "categories", id, { name }, (b, logId) =>
        b.set(doc(db, "categories", id), { name, description: f.description.replace(/[<>]/g, "").slice(0, 300), image: f.image, visible: f.visible, sort: cat?.sort ?? nextSort, ...(cat?.createdAt ? { createdAt: cat.createdAt } : { createdAt: serverTimestamp() }), updatedAt: serverTimestamp(), lastLogId: logId }));
      toast("تم الحفظ"); onClose();
    } catch (x) { setErr(errMsg(x)); } finally { setBusy(false); }
  };
  return (
    <Modal open title={cat ? "تعديل قسم" : "قسم جديد"} onClose={onClose}>
      <form onSubmit={save} className="space-y-3">
        <Field label="الاسم *"><input className={inputCls} value={f.name} maxLength={80} onChange={(e) => { const v = e.target.value; setF((p) => ({ ...p, name: v, id: cat ? p.id : p.id || slug(v) })); }} /></Field>
        {!cat && <Field label="المعرّف (إنجليزي)" hint="يظهر في رابط المتجر ولا يتغير بعد الإنشاء"><input className={inputCls} dir="ltr" value={f.id} onChange={(e) => setF((p) => ({ ...p, id: e.target.value }))} /></Field>}
        <Field label="الوصف"><textarea className={`${inputCls} h-20 py-2`} maxLength={300} value={f.description} onChange={(e) => setF((p) => ({ ...p, description: e.target.value }))} /></Field>
        <div className="flex items-center gap-3">{f.image && <img src={f.image} alt="" className="h-16 w-16 rounded-lg object-cover" />}
          <button type="button" className={btnGhost} onClick={() => fr.current?.click()}><Upload className="h-4 w-4" />صورة القسم</button>
          <input ref={fr} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={async (e) => { const file = e.target.files?.[0]; e.target.value = ""; if (!file) return; try { setF((p) => ({ ...p, image: "" })); const d = await compressImage(file, 400); setF((p) => ({ ...p, image: d })); } catch (x) { setErr(x.message); } }} /></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.visible} onChange={(e) => setF((p) => ({ ...p, visible: e.target.checked }))} />ظاهر في المتجر</label>
        {err && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{err}</p>}
        <div className="flex justify-end gap-2"><button type="button" className={btnGhost} onClick={onClose}>إلغاء</button><button disabled={busy} className={btnPrimary}>{busy ? "..." : "حفظ"}</button></div>
      </form>
    </Modal>
  );
}

export default function Categories() {
  const { categories, products } = useAdminData();
  const toast = useToast();
  const [edit, setEdit] = useState(null); const [del, setDel] = useState(null); const [busy, setBusy] = useState(false);
  const list = useMemo(() => [...categories.rows].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0)), [categories.rows]);
  const count = (id) => products.rows.filter((p) => p.category === id).length;

  const move = async (i, dir) => {
    const a = list[i], b = list[i + dir]; if (!b) return;
    setBusy(true);
    try {
      await commitLogged("category.reorder", "categories", `${a.id},${b.id}`, {}, (batch, logId) => {
        for (const [c, s] of [[a, b.sort ?? i + dir], [b, a.sort ?? i]]) {
          const { id, ...rest } = c;
          batch.set(doc(db, "categories", id), { ...rest, sort: s, updatedAt: serverTimestamp(), lastLogId: logId });
        }
      });
    } catch (e) { toast(errMsg(e), "err"); } finally { setBusy(false); }
  };
  const toggle = async (c) => {
    const { id, ...rest } = c; setBusy(true);
    try { await commitLogged("category.visibility", "categories", id, { visible: !c.visible }, (b, l) => b.set(doc(db, "categories", id), { ...rest, visible: !c.visible, updatedAt: serverTimestamp(), lastLogId: l })); } catch (e) { toast(errMsg(e), "err"); } finally { setBusy(false); }
  };
  const remove = async () => {
    if (count(del.id) > 0) return;
    setBusy(true);
    try { await commitLogged("category.delete", "categories", del.id, { name: del.name }, (b) => b.delete(doc(db, "categories", del.id))); toast("تم حذف القسم"); } catch (e) { toast(errMsg(e), "err"); } finally { setBusy(false); setDel(null); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-xl font-bold">الأقسام</h1><button className={btnPrimary} onClick={() => setEdit({})}><Plus className="h-4 w-4" />قسم جديد</button></div>
      <Card>
        {categories.error && <ErrorState message={categories.error} />}
        {categories.loading ? <TableSkeleton rows={4} /> : list.length === 0 ? <Empty title="لا توجد أقسام" /> : (
          <ul className="divide-y divide-stone-100">{list.map((c, i) => (
            <li key={c.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex flex-col"><button disabled={busy || i === 0} aria-label="أعلى" onClick={() => move(i, -1)} className="text-stone-400 hover:text-stone-900 disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button><button disabled={busy || i === list.length - 1} aria-label="أسفل" onClick={() => move(i, 1)} className="text-stone-400 hover:text-stone-900 disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button></div>
              {c.image ? <img src={c.image} alt="" className="h-10 w-10 rounded-lg object-cover" /> : <div className="h-10 w-10 rounded-lg bg-stone-100" />}
              <div className="min-w-0 flex-1"><p className="font-medium">{c.name} <span className="text-xs text-stone-400" dir="ltr">{c.id}</span></p><p className="text-xs text-stone-500">{count(c.id)} منتج</p></div>
              <button disabled={busy} aria-label="الظهور" onClick={() => toggle(c)} className="rounded-lg p-2 text-stone-500 hover:bg-stone-100">{c.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button>
              <button aria-label="تعديل" onClick={() => setEdit(c)} className="rounded-lg p-2 text-stone-500 hover:bg-stone-100"><Pencil className="h-4 w-4" /></button>
              <button aria-label="حذف" onClick={() => setDel(c)} className="rounded-lg p-2 text-rose-500 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
            </li>))}</ul>)}
      </Card>
      {edit && <CatForm cat={edit.id ? edit : null} nextSort={list.length} existingIds={list.map((c) => c.id)} onClose={() => setEdit(null)} />}
      <Confirm open={Boolean(del)} danger busy={busy} title="حذف القسم" confirmLabel={del && count(del.id) > 0 ? "حسناً" : "حذف"}
        message={del && count(del.id) > 0 ? `لا يمكن حذف "${del.name}" لأنه يحتوي على ${count(del.id)} منتج. انقل المنتجات لقسم آخر أو احذفها أولاً.` : `حذف القسم "${del?.name}"؟`}
        onCancel={() => setDel(null)} onConfirm={() => (count(del.id) > 0 ? setDel(null) : remove())} />
    </div>
  );
}
