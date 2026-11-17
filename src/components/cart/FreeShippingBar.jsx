// src/components/cart/FreeShippingBar.jsx
import { Truck, Check } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export default function FreeShippingBar() {
  const {
    cartSubtotal, freeShippingRemaining,
    freeShippingProgress, qualifiedForFreeShipping,
  } = useStore();

  return (
    <div className="px-6 py-4 bg-[#FFF9FA] border-b border-pink-100">
      <div className="flex items-center gap-2 mb-2 text-sm">
        {qualifiedForFreeShipping ? (
          <>
            <Check className="w-4 h-4 text-emerald-500" />
            <span className="text-emerald-600 font-medium">
              مبروك! شحن مجاني 🎉
            </span>
          </>
        ) : (
          <>
            <Truck className="w-4 h-4 text-pink-500" />
            <span className="text-neutral-700">
              أضيفي <strong className="text-pink-600">
                {freeShippingRemaining.toFixed(2)} ج.م
              </strong> للحصول على شحن مجاني
            </span>
          </>
        )}
      </div>

      <div className="h-2 bg-pink-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            qualifiedForFreeShipping
              ? 'bg-emerald-400'
              : 'bg-gradient-to-r from-pink-300 to-pink-500'
          }`}
          style={{ width: `${freeShippingProgress}%` }}
          role="progressbar"
          aria-valuenow={freeShippingProgress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}