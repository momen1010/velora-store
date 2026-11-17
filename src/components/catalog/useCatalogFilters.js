// src/components/catalog/useCatalogFilters.js
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getDiscount } from "./catalogConfig";

const norm = (s) => String(s ?? "").toLowerCase().trim();

/* ─── قيم مسموحة لضمان الأمان ─────────────────────────────── */
const ALLOWED_CATEGORIES = ["skincare", "makeup", "hair-care", "haircare", "fragrances", "fragrance", "bundles", "bundle"];
const ALLOWED_FILTERS    = ["best-sellers", "offers"];

const safeCategory = (v) =>
  v && ALLOWED_CATEGORIES.includes(norm(v)) ? norm(v) : "all";

const safeFilter = (v) =>
  v && ALLOWED_FILTERS.includes(norm(v)) ? norm(v) : null;

export default function useCatalogFilters(products = []) {
  const [searchParams, setSearchParams] = useSearchParams();

  /* ─── الحالة الأساسية ───────────────────────────────────── */
  const [query, setQuery]         = useState("");
  const [category, setCategory]   = useState("all");
  const [skinTypes, setSkinTypes] = useState([]);
  const [priceMin, setPriceMin]   = useState(null);
  const [priceMax, setPriceMax]   = useState(null);
  const [sort, setSort]           = useState("featured");
  const [filter, setFilter]       = useState(null); // best-sellers | offers | null

  const deferredQuery = useDeferredValue(query);

  /* ══════════════════════════════════════════════════════════
     🔗 URL → STATE (مزامنة عند التحميل وعند تغيير الرابط)
     ══════════════════════════════════════════════════════════ */
  const categoryFromURL = safeCategory(searchParams.get("category"));
  const filterFromURL   = safeFilter(searchParams.get("filter"));
  const queryFromURL    = searchParams.get("q") ?? "";
  const focusFromURL    = searchParams.get("focus");

  // نستخدم ref لتجنب حلقة لا نهائية بين URL ↔ State
  const lastSyncedURL = useRef("");

  useEffect(() => {
    const signature = `${categoryFromURL}|${filterFromURL}|${queryFromURL}|${focusFromURL}`;
    if (signature === lastSyncedURL.current) return;
    lastSyncedURL.current = signature;

    // فرض الحالة من الـ URL (المصدر الأعلى أولوية)
    if (categoryFromURL !== category) setCategory(categoryFromURL);
    if (filterFromURL !== filter)     setFilter(filterFromURL);
    if (queryFromURL !== query)       setQuery(queryFromURL);
    // focus=search → فقط لعرض شريط البحث عند الحاجة (يمكن تجاهله)
  }, [categoryFromURL, filterFromURL, queryFromURL, focusFromURL, category, filter, query]);

  /* ══════════════════════════════════════════════════════════
     🎯 STATE → URL (عندما يغيّر المستخدم الفلتر يدوياً)
     ══════════════════════════════════════════════════════════ */
  const updateURL = useCallback(
    (patch) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          Object.entries(patch).forEach(([k, v]) => {
            if (v == null || v === "" || v === "all") next.delete(k);
            else next.set(k, v);
          });
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  /* ─── Setters موحّدة (تحدّث State + URL) ────────────────── */
  const changeCategory = useCallback(
    (value) => {
      const safe = safeCategory(value);
      setCategory(safe);
      updateURL({ category: safe });
    },
    [updateURL]
  );

  const changeFilter = useCallback(
    (value) => {
      const safe = safeFilter(value);
      setFilter(safe);
      updateURL({ filter: safe ?? "" });
    },
    [updateURL]
  );

  const changeQuery = useCallback(
    (value) => {
      const safe = String(value ?? "").slice(0, 100);
      setQuery(safe);
      updateURL({ q: safe.trim() || "" });
    },
    [updateURL]
  );

  /* ─── الحدود ────────────────────────────────────────────── */
  const bounds = useMemo(() => {
    if (!products.length) return { min: 0, max: 0 };
    const prices = products.map((p) => p.price);
    return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
  }, [products]);

  const skinOptions = useMemo(
    () => [...new Set(products.flatMap((p) => p.skinType || []))].filter((t) => t !== "all"),
    [products]
  );

  const min = Math.max(priceMin ?? bounds.min, bounds.min);
  const max = Math.min(priceMax ?? bounds.max, bounds.max);
  const priceActive = min > bounds.min || max < bounds.max;

  const changeMin = useCallback(
    (v) => {
      const next = Math.min(Number(v), max);
      setPriceMin(next <= bounds.min ? null : next);
    },
    [max, bounds.min]
  );
  const changeMax = useCallback(
    (v) => {
      const next = Math.max(Number(v), min);
      setPriceMax(next >= bounds.max ? null : next);
    },
    [min, bounds.max]
  );

  const toggleSkinType = useCallback(
    (t) =>
      setSkinTypes((prev) =>
        prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
      ),
    []
  );

  const resetPrice = useCallback(() => {
    setPriceMin(null);
    setPriceMax(null);
  }, []);

  const resetAll = useCallback(() => {
    setQuery("");
    setCategory("all");
    setSkinTypes([]);
    setPriceMin(null);
    setPriceMax(null);
    setFilter(null);
    // نظّف الـ URL بالكامل
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  /* ══════════════════════════════════════════════════════════
     الفلترة النهائية
     ══════════════════════════════════════════════════════════ */
  const filtered = useMemo(() => {
    const tokens = norm(deferredQuery).split(/\s+/).filter(Boolean);

    const list = products.filter((p) => {
      /* فلتر الفئة */
      if (category !== "all") {
        const pcat = norm(p.category);
        const normalized =
          pcat === "haircare" ? "hair-care" :
          pcat === "fragrance" ? "fragrances" :
          pcat === "bundle" ? "bundles" :
          pcat;
        if (normalized !== category) return false;
      }

      /* فلتر العروض/الأكثر مبيعاً */
      if (filter === "best-sellers" && p.badge !== "الأكثر مبيعاً") return false;
      if (filter === "offers" && !p.discount) return false;

      /* فلتر السعر */
      if (p.price < min || p.price > max) return false;

      /* فلتر نوع البشرة */
      if (skinTypes.length) {
        const types = p.skinType || [];
        if (!types.includes("all") && !skinTypes.some((t) => types.includes(t))) return false;
      }

      /* البحث النصي */
      if (tokens.length) {
        const hay = norm(`${p.name} ${p.brand}`);
        if (!tokens.every((t) => hay.includes(t))) return false;
      }
      return true;
    });

    const sorters = {
      topRated:  (a, b) => b.rating - a.rating,
      discount:  (a, b) => (getDiscount(b) ?? 0) - (getDiscount(a) ?? 0),
      priceAsc:  (a, b) => a.price - b.price,
      priceDesc: (a, b) => b.price - a.price,
      featured:  (a, b) => b.reviews - a.reviews,
    };
    return [...list].sort(sorters[sort] || sorters.featured);
  }, [products, deferredQuery, category, filter, skinTypes, min, max, sort]);

  const activeFilterCount =
    skinTypes.length +
    (priceActive ? 1 : 0) +
    (filter ? 1 : 0);

  return {
    // بحث
    query, setQuery: changeQuery,
    // فئة
    category, setCategory: changeCategory,
    // فلتر خاص (best-sellers | offers)
    filter, setFilter: changeFilter,
    // بشرة
    skinTypes, toggleSkinType, skinOptions,
    // سعر
    bounds,
    priceMin: min,
    priceMax: max,
    changeMin,
    changeMax,
    priceActive,
    resetPrice,
    // ترتيب
    sort, setSort,
    // نتائج
    filtered,
    activeFilterCount,
    hasAnyFilter:
      activeFilterCount > 0 ||
      category !== "all" ||
      query.trim() !== "" ||
      filter !== null,
    resetAll,
  };
}