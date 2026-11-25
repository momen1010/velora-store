// بانر بلاك فرايدي أعلى المتجر: عدّ تنازلي لبداية العرض ثم لنهايته، ويختفي تلقائياً بعد انتهائه.
// يظهر في كل صفحات المتجر (لا يظهر في لوحة الأدمن لأن Storefront فقط هو من يعرضه).
// نافذة العرض: الجمعة ٢٧ نوفمبر ٢٠٢٦ ٠٠:٠٠ حتى الأحد ٢٩ نوفمبر ٢٣:٥٩:٥٩ بتوقيت القاهرة (UTC+2 في نوفمبر).
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Tag } from "lucide-react";

const BF_START = Date.UTC(2026, 10, 26, 22, 0, 0); // الجمعة ٢٧ نوفمبر ٠٠:٠٠ بتوقيت القاهرة
const BF_END = Date.UTC(2026, 10, 29, 22, 0, 0); // الاثنين ٣٠ نوفمبر ٠٠:٠٠ بتوقيت القاهرة
const PROMO_CODE = "BLACKFRIDAY";

const arNum = (n) => Number(n).toLocaleString("ar-EG");

function CountdownCell({ value, label }) {
  return (
    <span className="inline-flex flex-col items-center" aria-hidden="true">
      <span className="min-w-9 rounded-md bg-black/40 px-1.5 py-0.5 text-sm font-bold tabular-nums text-[#F3D9A4] sm:min-w-10 sm:text-base">
        {arNum(value)}
      </span>
      <span className="mt-0.5 text-[10px] text-[#E9C9D4]">{label}</span>
    </span>
  );
}

export default function BlackFridayBanner() {
  const [now, setNow] = useState(() => Date.now());
  const ended = now >= BF_END;

  useEffect(() => {
    if (ended) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [ended]);

  if (ended) return null;

  const live = now >= BF_START;
  const target = live ? BF_END : BF_START;
  const diff = Math.max(0, Math.floor((target - now) / 1000));
  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const mins = Math.floor((diff % 3600) / 60);
  const secs = diff % 60;

  const srText = live
    ? `بلاك فرايدي: خصم ٢٥٪ على كل المنتجات بكود ${PROMO_CODE}. ينتهي العرض خلال ${arNum(days)} يوم و${arNum(hours)} ساعة.`
    : `بلاك فرايدي قادم: خصم ٢٥٪ على كل المنتجات بكود ${PROMO_CODE}. يبدأ العرض خلال ${arNum(days)} يوم و${arNum(hours)} ساعة.`;

  return (
    <section
      aria-label="عرض بلاك فرايدي"
      className="relative overflow-hidden bg-gradient-to-l from-[#1C0F16] via-[#3B2230] to-[#1C0F16] px-4 py-2.5 text-center"
    >
      <p className="sr-only" role="status">{srText}</p>
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#F3D9A4]">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          {live ? "بلاك فرايدي — خصم ٢٥٪ على كل شيء!" : "بلاك فرايدي قادم — خصم ٢٥٪ على كل شيء"}
        </span>

        <span className="inline-flex items-center gap-1.5" dir="ltr">
          <CountdownCell value={days} label="يوم" />
          <CountdownCell value={hours} label="ساعة" />
          <CountdownCell value={mins} label="دقيقة" />
          <CountdownCell value={secs} label="ثانية" />
        </span>

        <span className="inline-flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-[#F3D9A4]/70 px-2.5 py-0.5 text-xs font-bold tracking-wider text-[#F3D9A4]" dir="ltr">
            <Tag className="h-3 w-3" aria-hidden="true" />
            {PROMO_CODE}
          </span>
          {live && (
            <Link
              to="/shop"
              className="rounded-full bg-[#C2557A] px-3 py-1 text-xs font-bold text-white transition-colors hover:bg-[#F3D9A4] hover:text-[#1C0F16]"
            >
              تسوّقي الآن
            </Link>
          )}
        </span>
      </div>
    </section>
  );
}
