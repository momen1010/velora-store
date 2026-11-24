// دليل مقاسات الأحذية (مقاس أوروبي ↔ طول القدم بالسنتيمتر، قيم تقريبية).
import { useEffect } from "react";
import { X, Ruler } from "lucide-react";

const ROWS = [
  ["36", "22.8"], ["37", "23.5"], ["38", "24.1"], ["39", "24.8"], ["40", "25.4"], ["41", "26.0"],
];

export default function SizeGuide({ open, onClose, available = [] }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);
  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label="دليل المقاسات" className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div dir="rtl" onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-bold text-[#4A2C3A]"><Ruler className="h-5 w-5 text-[#C2557A]" />دليل المقاسات</h3>
          <button type="button" onClick={onClose} aria-label="إغلاق" className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </div>
        <table className="w-full overflow-hidden rounded-xl text-center text-sm">
          <thead className="bg-[#FCE7EC] text-[#4A2C3A]">
            <tr><th className="py-2.5 font-semibold">المقاس (EU)</th><th className="py-2.5 font-semibold">طول القدم (سم)</th></tr>
          </thead>
          <tbody>
            {ROWS.map(([eu, cm]) => {
              const on = available.length === 0 || available.includes(eu);
              return (
                <tr key={eu} className="border-b border-gray-100 last:border-0">
                  <td className={`py-2.5 font-medium ${on ? "text-gray-900" : "text-gray-300 line-through"}`}>{eu}</td>
                  <td className={`py-2.5 ${on ? "text-gray-700" : "text-gray-300"}`}>{cm}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="mt-5 rounded-2xl bg-[#FFF9FA] p-4 text-sm leading-relaxed text-gray-700">
          <p className="mb-1 font-semibold text-[#4A2C3A]">إزاي تقيسي قدمك؟</p>
          <ol className="list-decimal space-y-1 pe-5">
            <li>قفي على ورقة وارسمي حدود قدمك.</li>
            <li>قيسي المسافة من أطول صباع لآخر الكعب.</li>
            <li>اختاري المقاس الأقرب لطولك. لو بين مقاسين خدي الأكبر.</li>
          </ol>
        </div>
        <p className="mt-3 text-xs text-gray-400">القياسات تقريبية وقد تختلف قليلاً من موديل لآخر. لو محتارة كلمينا على واتساب.</p>
      </div>
    </div>
  );
}
