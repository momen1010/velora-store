// src/components/layout/SiteFooter.jsx
import { Link } from "react-router-dom";
import { MessageCircle, Truck, Banknote, RotateCcw } from "lucide-react";
import { WHATSAPP_NUMBER } from "../../config/store";
import { FREE_SHIPPING_THRESHOLD } from "../../context/CartContext";
import { formatPrice } from "../catalog/catalogConfig";

const SHOP = [
  { label: "كل المنتجات", to: "/shop" },
  { label: "العناية بالبشرة", to: "/shop?category=skincare" },
  { label: "المكياج", to: "/shop?category=makeup" },
  { label: "الشنط", to: "/shop?category=bags" },
  { label: "الأحذية", to: "/shop?category=shoes" },
];
const INFO = [
  { label: "من نحن", to: "/about" },
  { label: "الشحن والاسترجاع", to: "/shipping-returns" },
  { label: "سياسة الخصوصية", to: "/privacy" },
  { label: "تواصل معنا", to: "/contact" },
];

const col = "text-sm text-[#8C6F7B] transition hover:text-[#C2557A]";

export default function SiteFooter() {
  return (
    <footer dir="rtl" className="mt-10 border-t border-[#F3D5DD] bg-white font-['Tajawal',system-ui,sans-serif] text-[#4A2C3A]">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <Link to="/" aria-label="Velora - الصفحة الرئيسية">
            <img src="/velora-logo.png" alt="Velora" className="h-20 w-auto object-contain" loading="lazy" />
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-7 text-[#8C6F7B]">
            Velora متجر مصري للعناية بالبشرة والمكياج والشنط والأحذية. منتجات مختارة بعناية وتوصيل لكل المحافظات.
          </p>
          <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#4A2C3A]">
            <li className="inline-flex items-center gap-1.5"><Truck className="h-4 w-4 text-[#C2557A]" aria-hidden="true" />شحن مجاني فوق {formatPrice(FREE_SHIPPING_THRESHOLD)}</li>
            <li className="inline-flex items-center gap-1.5"><Banknote className="h-4 w-4 text-[#C2557A]" aria-hidden="true" />الدفع عند الاستلام</li>
            <li className="inline-flex items-center gap-1.5"><RotateCcw className="h-4 w-4 text-[#C2557A]" aria-hidden="true" />استرجاع مرن</li>
          </ul>
          {WHATSAPP_NUMBER && (
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-[#1FAF5A] px-6 text-sm font-bold text-white transition hover:bg-[#188A47]"
            >
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
              تواصل معنا على واتساب
            </a>
          )}
        </div>
        <nav aria-label="التسوق">
          <h2 className="mb-4 text-sm font-bold">تسوّقي</h2>
          <ul className="space-y-3">{SHOP.map((l) => <li key={l.to}><Link to={l.to} className={col}>{l.label}</Link></li>)}</ul>
        </nav>
        <nav aria-label="معلومات">
          <h2 className="mb-4 text-sm font-bold">معلومات</h2>
          <ul className="space-y-3">{INFO.map((l) => <li key={l.to}><Link to={l.to} className={col}>{l.label}</Link></li>)}</ul>
        </nav>
      </div>
      <div className="border-t border-[#F3D5DD] py-5 text-center text-xs text-[#8C6F7B]">
        © {new Date().getFullYear()} Velora. جميع الحقوق محفوظة.
      </div>
    </footer>
  );
}
