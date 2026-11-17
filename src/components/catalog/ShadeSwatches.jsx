// src/components/catalog/ShadeSwatches.jsx
import { useState } from "react";
import { L } from "./catalogConfig";

export default function ShadeSwatches({ shades = [], selectedIndex = 0, onSelect, onPreview, max = 5 }) {
  const [expanded, setExpanded] = useState(false);
  if (!shades.length) return null;

  const visible = expanded ? shades : shades.slice(0, max);
  const extra = shades.length - visible.length;

  return (
    <div role="radiogroup" aria-label={L.shades} className="flex flex-wrap items-center gap-0.5">
      {visible.map((s, i) => {
        const selected = i === selectedIndex;
        return (
          <button
            key={`${s.name}-${s.hex}`}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={s.name}
            title={s.name}
            onClick={() => onSelect?.(i)}
            onMouseEnter={() => onPreview?.(i)}
            onMouseLeave={() => onPreview?.(null)}
            onFocus={() => onPreview?.(i)}
            onBlur={() => onPreview?.(null)}
            className="rounded-full p-[3px] outline-none focus-visible:ring-2 focus-visible:ring-[#C2557A]"
          >
            <span
              className={`block h-[18px] w-[18px] rounded-full border border-black/10 transition-shadow motion-reduce:transition-none ${
                selected ? "ring-2 ring-[#C2557A] ring-offset-2 ring-offset-[#FFF9FA]" : ""
              }`}
              style={{ backgroundColor: s.hex }}
            />
          </button>
        );
      })}
      {extra > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          aria-label={L.moreShades(extra)}
          className="ms-1 rounded-full px-1.5 text-xs font-medium text-[#8C6F7B] outline-none hover:text-[#C2557A] focus-visible:ring-2 focus-visible:ring-[#C2557A]"
        >
          +{extra}
        </button>
      )}
    </div>
  );
}
