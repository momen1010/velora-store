// معرض صور المنتج: تكبير بالماوس على الديسكتوب، سحب أفقي على الموبايل، وعرض ملء الشاشة.
import { useEffect, useRef, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";

const PLACEHOLDER = "/placeholder.svg";
const onErr = (e) => { e.currentTarget.onerror = null; e.currentTarget.src = PLACEHOLDER; };

function Lightbox({ images, index, setIndex, alt, onClose }) {
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const go = useCallback((d) => { setZoomed(false); setIndex((i) => (i + d + images.length) % images.length); }, [images.length, setIndex]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") go(1);
      if (e.key === "ArrowRight") go(-1);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [go, onClose]);

  const move = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="عرض الصورة" className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90" onClick={onClose}>
      <button type="button" onClick={onClose} aria-label="إغلاق" className="absolute end-4 top-4 z-10 rounded-full bg-white/15 p-2.5 text-white hover:bg-white/25">
        <X className="h-6 w-6" />
      </button>
      {images.length > 1 && (
        <>
          <button type="button" aria-label="السابقة" onClick={(e) => { e.stopPropagation(); go(-1); }} className="absolute start-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/15 p-2.5 text-white hover:bg-white/25"><ChevronRight className="h-6 w-6" /></button>
          <button type="button" aria-label="التالية" onClick={(e) => { e.stopPropagation(); go(1); }} className="absolute end-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/15 p-2.5 text-white hover:bg-white/25"><ChevronLeft className="h-6 w-6" /></button>
        </>
      )}
      <div className="max-h-[88vh] max-w-[92vw] overflow-hidden rounded-xl" onClick={(e) => { e.stopPropagation(); setZoomed((z) => !z); }} onMouseMove={zoomed ? move : undefined}>
        <img
          src={images[index]} alt={alt} onError={onErr} draggable={false}
          style={{ transformOrigin: origin }}
          className={`max-h-[88vh] max-w-[92vw] object-contain transition-transform duration-200 motion-reduce:transition-none ${zoomed ? "scale-[2.2] cursor-zoom-out" : "cursor-zoom-in"}`}
        />
      </div>
      <p className="absolute bottom-4 start-1/2 -translate-x-1/2 rounded-full bg-white/15 px-3 py-1 text-xs text-white">
        {zoomed ? "اضغطي للتصغير" : "اضغطي للتكبير"}{images.length > 1 ? ` • ${index + 1}/${images.length}` : ""}
      </p>
    </div>
  );
}

export default function ProductGallery({ images, alt, badge, discount }) {
  const list = images.length ? images : [PLACEHOLDER];
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const scroller = useRef(null);

  useEffect(() => { setIndex(0); }, [list[0]]); // eslint-disable-line react-hooks/exhaustive-deps

  const move = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
  };
  const onScroll = () => {
    const el = scroller.current; if (!el) return;
    const w = el.clientWidth || 1;
    setIndex(Math.min(list.length - 1, Math.max(0, Math.round(Math.abs(el.scrollLeft) / w))));
  };

  const tags = (
    <div className="pointer-events-none absolute start-3 top-3 z-10 flex flex-col items-start gap-1.5">
      {badge && <span className="rounded-full bg-[#4A2C3A] px-3 py-1 text-xs font-semibold text-white">{badge}</span>}
      {discount ? <span className="rounded-full bg-[#C2557A] px-3 py-1 text-xs font-semibold text-white">خصم {discount}%</span> : null}
    </div>
  );

  return (
    <div className="md:sticky md:top-24 md:self-start">
      <div className="flex gap-3">
        {list.length > 1 && (
          <div className="hidden w-16 shrink-0 flex-col gap-2 md:flex" role="tablist" aria-label="صور المنتج">
            {list.map((src, i) => (
              <button key={src + i} type="button" role="tab" aria-selected={i === index} aria-label={`صورة ${i + 1}`} onClick={() => setIndex(i)}
                className={`overflow-hidden rounded-xl border-2 bg-[#FCE7EC] transition ${i === index ? "border-[#4A2C3A]" : "border-transparent opacity-70 hover:opacity-100"}`}>
                <img src={src} alt="" onError={onErr} className="aspect-square h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="min-w-0 flex-1">
          {/* ديسكتوب: تكبير بالماوس */}
          <div
            className="relative hidden aspect-square cursor-zoom-in overflow-hidden rounded-3xl bg-[#FCE7EC] md:block"
            onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onMouseMove={move}
            onClick={() => setOpen(true)}
          >
            {tags}
            <img src={list[index]} alt={alt} onError={onErr} draggable={false} style={{ transformOrigin: origin }}
              className={`h-full w-full object-cover transition-transform duration-200 motion-reduce:transition-none ${hover ? "scale-[1.9]" : "scale-100"}`} />
            <span className="pointer-events-none absolute bottom-3 end-3 flex items-center gap-1 rounded-full bg-white/85 px-3 py-1 text-xs text-[#4A2C3A] shadow"><ZoomIn className="h-3.5 w-3.5" />تكبير</span>
          </div>

          {/* موبايل: سحب بين الصور */}
          <div className="relative md:hidden">
            {tags}
            <div ref={scroller} onScroll={onScroll} className="flex snap-x snap-mandatory overflow-x-auto rounded-3xl bg-[#FCE7EC] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {list.map((src, i) => (
                <button key={src + i} type="button" onClick={() => setOpen(true)} aria-label="تكبير الصورة" className="aspect-square w-full shrink-0 snap-center">
                  <img src={src} alt={i === 0 ? alt : ""} onError={onErr} draggable={false} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
            {list.length > 1 && (
              <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5" aria-hidden="true">
                {list.map((_, i) => <span key={i} className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-[#4A2C3A]" : "w-1.5 bg-white/80"}`} />)}
              </div>
            )}
            <span className="pointer-events-none absolute bottom-3 end-3 rounded-full bg-white/85 p-1.5 text-[#4A2C3A] shadow"><ZoomIn className="h-4 w-4" /></span>
          </div>
        </div>
      </div>
      {open && <Lightbox images={list} index={index} setIndex={setIndex} alt={alt} onClose={() => setOpen(false)} />}
    </div>
  );
}
