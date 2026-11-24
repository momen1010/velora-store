// عناصر واجهة مشتركة للوحة الأدمن
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Inbox, X } from "lucide-react";
import { STATUSES } from "../lib/constants";

export const money = (n) => `${Number(n || 0).toLocaleString("ar-EG", { maximumFractionDigits: 2 })} ج.م`;
export const dateTime = (t) => {
  const d = t?.toDate ? t.toDate() : t ? new Date(t) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" }) : "-";
};

export function StatusBadge({ status }) {
  const s = STATUSES[status] ?? { label: status, cls: "bg-stone-100 text-stone-600 ring-stone-200" };
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${s.cls}`}>{s.label}</span>;
}

export function Skeleton({ className = "h-5 w-full" }) {
  return <div className={`animate-pulse rounded-md bg-stone-200/70 ${className}`} />;
}
export const TableSkeleton = ({ rows = 6 }) => (
  <div className="space-y-3 p-4">{Array.from({ length: rows }, (_, i) => <Skeleton key={i} className="h-8" />)}</div>
);

export function Empty({ title = "لا توجد بيانات", hint }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-14 text-center text-stone-500">
      <Inbox className="h-10 w-10 text-stone-300" aria-hidden="true" />
      <p className="font-medium text-stone-700">{title}</p>
      {hint && <p className="text-sm">{hint}</p>}
    </div>
  );
}
export function ErrorState({ message, onRetry }) {
  return (
    <div role="alert" className="m-4 flex items-start gap-3 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="flex-1">{message}</div>
      {onRetry && <button onClick={onRetry} className="font-bold underline">إعادة المحاولة</button>}
    </div>
  );
}

export function Modal({ open, title, onClose, children, wide = false }) {
  useEffect(() => {
    if (!open) return undefined;
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className={`max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:rounded-2xl ${wide ? "sm:max-w-3xl" : "sm:max-w-lg"}`}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-100 bg-white px-5 py-3">
          <h2 className="text-base font-bold text-stone-800">{title}</h2>
          <button onClick={onClose} aria-label="إغلاق" className="rounded-full p-1.5 text-stone-500 hover:bg-stone-100"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Confirm({ open, title, message, confirmLabel = "تأكيد", danger = false, busy = false, onConfirm, onCancel }) {
  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <p className="text-sm leading-7 text-stone-600">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onCancel} className="h-10 rounded-lg px-4 text-sm font-medium text-stone-600 hover:bg-stone-100">إلغاء</button>
        <button disabled={busy} onClick={onConfirm} className={`h-10 rounded-lg px-5 text-sm font-bold text-white disabled:opacity-60 ${danger ? "bg-rose-600 hover:bg-rose-700" : "bg-stone-900 hover:bg-stone-700"}`}>{busy ? "..." : confirmLabel}</button>
      </div>
    </Modal>
  );
}

const ToastCtx = createContext(() => {});
export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((message, type = "ok") => {
    const id = Math.random();
    setItems((p) => [...p, { id, message, type }]);
    setTimeout(() => setItems((p) => p.filter((x) => x.id !== id)), 4000);
  }, []);
  const value = useMemo(() => push, [push]);
  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4">
        {items.map((t) => (
          <div key={t.id} className={`pointer-events-auto flex max-w-md items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-white shadow-lg ${t.type === "err" ? "bg-rose-600" : "bg-stone-900"}`}>
            {t.type === "err" ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}{t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastCtx);

export const inputCls = "h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-stone-900";
export const btnPrimary = "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-stone-900 px-4 text-sm font-bold text-white hover:bg-stone-700 disabled:opacity-60";
export const btnGhost = "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-60";
export const Field = ({ label, children, hint }) => (
  <label className="block text-sm"><span className="mb-1 block font-medium text-stone-700">{label}</span>{children}{hint && <span className="mt-1 block text-xs text-stone-500">{hint}</span>}</label>
);
export const Card = ({ title, action, children, className = "" }) => (
  <section className={`rounded-2xl border border-stone-200 bg-white ${className}`}>
    {(title || action) && <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3"><h3 className="text-sm font-bold text-stone-800">{title}</h3>{action}</div>}
    {children}
  </section>
);
