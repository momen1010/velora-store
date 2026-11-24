// src/components/catalog/FilterPanel.jsx
import { useEffect } from "react";
import { X } from "lucide-react";
import { L, SKIN_LABELS, formatPrice } from "./catalogConfig";

// محتوى الفلاتر: يُستخدم في الشريط الجانبي (ديسكتوب) وفي FilterSheet (موبايل)
export default function FilterPanel({
  skinOptions = [],
  skinTypes = [],
  onToggleSkinType,
  bounds,
  priceMin,
  priceMax,
  onChangeMin,
  onChangeMax,
  currency,
  onReset,
  canReset,
}) {
  const sliderClass = "w-full accent-[#C2557A]";
  return (
    <div className="flex flex-col gap-7">
      {skinOptions.length > 0 && (
      <section aria-labelledby="f-skin">
        <h3 id="f-skin" className="mb-3 text-sm font-bold text-[#4A2C3A]">{L.skinType}</h3>
        <div className="flex flex-wrap gap-2">
          {skinOptions.map((t) => {
            const on = skinTypes.includes(t);
            return (
              <button
                key={t}
                type="button"
                aria-pressed={on}
                onClick={() => onToggleSkinType(t)}
                className={`rounded-full border px-3.5 py-1.5 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#C2557A] ${
                  on
                    ? "border-[#C2557A] bg-[#C2557A] text-white"
                    : "border-[#F3D5DD] bg-white text-[#4A2C3A] hover:border-[#C2557A]"
                }`}
              >
                {SKIN_LABELS[t] ?? t}
              </button>
            );
          })}
        </div>
      </section>
      )}

      <section aria-labelledby="f-price">
        <h3 id="f-price" className="mb-3 text-sm font-bold text-[#4A2C3A]">{L.price}</h3>
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-xs text-[#8C6F7B]">
            <span className="flex justify-between">
              <span>{L.priceFrom}</span>
              <span className="font-medium text-[#4A2C3A]">{formatPrice(priceMin, currency)}</span>
            </span>
            <input type="range" className={sliderClass} min={bounds.min} max={bounds.max} step={10} value={priceMin} onChange={(e) => onChangeMin(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5 text-xs text-[#8C6F7B]">
            <span className="flex justify-between">
              <span>{L.priceTo}</span>
              <span className="font-medium text-[#4A2C3A]">{formatPrice(priceMax, currency)}</span>
            </span>
            <input type="range" className={sliderClass} min={bounds.min} max={bounds.max} step={10} value={priceMax} onChange={(e) => onChangeMax(e.target.value)} />
          </label>
        </div>
      </section>

      {canReset && (
        <button type="button" onClick={onReset} className="self-start text-sm font-medium text-[#C2557A] underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[#C2557A]">
          {L.resetAll}
        </button>
      )}
    </div>
  );
}

// نافذة سفلية للموبايل
export function FilterSheet({ open, onClose, resultCount, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={L.filters}>
      <div className="absolute inset-0 bg-[#4A2C3A]/40" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col rounded-t-3xl bg-[#FFF9FA] shadow-2xl">
        <div className="flex items-center justify-between px-5 pb-2 pt-4">
          <h2 className="text-base font-bold text-[#4A2C3A]">{L.filters}</h2>
          <button type="button" autoFocus onClick={onClose} aria-label={L.close} className="flex h-9 w-9 items-center justify-center rounded-full text-[#4A2C3A] outline-none hover:bg-[#FBE4EA] focus-visible:ring-2 focus-visible:ring-[#C2557A]">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-3">{children}</div>
        <div className="border-t border-[#F3D5DD] p-4">
          <button type="button" onClick={onClose} className="h-12 w-full rounded-full bg-[#4A2C3A] text-sm font-bold text-white outline-none hover:bg-[#C2557A] focus-visible:ring-2 focus-visible:ring-[#C2557A] focus-visible:ring-offset-2">
            {L.showResults(resultCount)}
          </button>
        </div>
      </div>
    </div>
  );
}
