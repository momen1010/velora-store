// src/components/cart/CartItem.jsx
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useStore, MAX_QTY_PER_ITEM } from '../../context/StoreContext';
import { sanitizeImageUrl, sanitizeText, isValidHex } from '../../utils/sanitize';

export default function CartItem({ item }) {
  const { updateQuantity, removeFromCart } = useStore();
  const { product, quantity, shade } = item;

  const imgSrc = sanitizeImageUrl(product.image);
  const name = sanitizeText(product.name);
  const brand = sanitizeText(product.brand);

  return (
    <div className="flex gap-3 py-4 border-b border-pink-100">
      <div className="w-20 h-20 rounded-xl bg-[#FFF9FA] overflow-hidden flex-shrink-0">
        {imgSrc && (
          <img
            src={imgSrc}
            alt={name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs text-pink-500 font-medium">{brand}</p>
        <h4 className="text-sm font-semibold text-neutral-800 truncate">{name}</h4>

        {shade && isValidHex(shade.hex) && (
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className="w-3.5 h-3.5 rounded-full border border-neutral-200"
              style={{ backgroundColor: shade.hex }}
            />
            <span className="text-xs text-neutral-500">{sanitizeText(shade.name)}</span>
          </div>
        )}

        {shade && isValidHex(shade.hex) && (
  <div className="flex items-center gap-1.5 mt-1">
    <span
      className="w-3.5 h-3.5 rounded-full border border-neutral-200"
      style={{ backgroundColor: shade.hex }}
    />
    <span className="text-xs text-neutral-500">{sanitizeText(shade.name)}</span>
  </div>
)}

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2 border border-pink-200 rounded-full">
            <button
              onClick={() => updateQuantity(product.id, shade?.hex ?? null, quantity - 1)}
              className="p-1.5 hover:bg-pink-50 rounded-full transition"
              aria-label="تقليل الكمية"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-sm font-medium w-6 text-center">{quantity}</span>
            <button
              onClick={() => updateQuantity(product.id, shade?.hex ?? null, quantity + 1)}
              disabled={quantity >= MAX_QTY_PER_ITEM}
              className="p-1.5 hover:bg-pink-50 rounded-full transition disabled:opacity-40"
              aria-label="زيادة الكمية"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          

          <div className="text-right">
            <p className="text-sm font-semibold text-neutral-800">
              {(product.price * quantity).toFixed(2)} ج.م
            </p>
            <button
              onClick={() => removeFromCart(product.id, shade?.hex ?? null)}
              className="text-xs text-neutral-400 hover:text-red-500 transition flex items-center gap-1 ml-auto"
            >
              <Trash2 className="w-3 h-3" /> إزالة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}