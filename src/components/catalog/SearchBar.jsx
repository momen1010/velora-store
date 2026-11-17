// src/components/catalog/SearchBar.jsx
import { Search, X } from "lucide-react";
import { L } from "./catalogConfig";

export default function SearchBar({ value, onChange, placeholder = L.searchPlaceholder, className = "" }) {
  return (
    <div role="search" className={`relative ${className}`}>
      <label htmlFor="catalog-search" className="sr-only">{L.searchLabel}</label>
      <Search className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8C6F7B]" aria-hidden="true" />
      <input
        id="catalog-search"
        type="text"
        inputMode="search"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-full border border-[#F3D5DD] bg-white ps-11 pe-10 text-sm text-[#4A2C3A] outline-none placeholder:text-[#8C6F7B] focus:border-[#C2557A] focus:ring-2 focus:ring-[#C2557A]/20"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label={L.clearSearch}
          className="absolute end-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[#8C6F7B] outline-none hover:bg-[#FBE4EA] focus-visible:ring-2 focus-visible:ring-[#C2557A]"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
