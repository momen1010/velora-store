// حقل كود الخصم في صفحة الدفع. التحقق النهائي يتم في قواعد Firestore عند إنشاء الطلب.
import { useState } from "react";
import { Tag, X } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { formatPrice } from "../catalog/catalogConfig";

export default function PromoBox() {
  const { promo, promoCode, discount, promoMinOrder, applyPromo, removePromo } = useCart();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError("");
    const res = await applyPromo(code);
    setBusy(false);
    if (!res.ok) setError(res.message);
    else setCode("");
  };

  if (promo) {
    return (
      <div className="mt-4 rounded-xl bg-[#FDF2F5] p-3 text-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 font-medium text-[#4A2C3A]">
            <Tag className="h-4 w-4 text-[#C2557A]" aria-hidden="true" />
            {promo.code}{promoCode ? ` (وفّرتِ ${formatPrice(discount)})` : ""}
          </span>
          <button type="button" onClick={removePromo} aria-label="إزالة الكود" className="rounded-full p-1 text-[#8C6F7B] hover:text-[#C2557A]">
            <X className="h-4 w-4" />
          </button>
        </div>
        {promoMinOrder && <p className="mt-1 text-xs text-[#8C6F7B]">الكود يعمل لطلبات من {formatPrice(promoMinOrder)} فأكثر.</p>}
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (code && !busy) submit(); } }}
          placeholder="كود الخصم"
          dir="ltr"
          maxLength={30}
          aria-label="كود الخصم"
          className="h-11 min-w-0 flex-1 rounded-xl border border-[#F3D5DD] bg-white px-3 text-sm outline-none focus:border-[#C2557A]"
        />
        <button type="button" disabled={!code || busy} onClick={submit} className="h-11 rounded-xl border border-[#4A2C3A] px-4 text-sm font-bold text-[#4A2C3A] hover:bg-[#4A2C3A] hover:text-white disabled:opacity-50">
          {busy ? "..." : "تطبيق"}
        </button>
      </div>
      {error && <p role="alert" className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
