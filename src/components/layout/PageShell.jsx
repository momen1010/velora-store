// src/components/layout/PageShell.jsx
// الإطار المشترك للصفحات الداخلية: RTL + الخلفية + الهيدر + الفوتر.
import SiteHeader from "./SiteHeader";

export default function PageShell({ children, maxWidth = "max-w-7xl" }) {
  return (
    <div
      dir="rtl"
      className="flex min-h-screen flex-col bg-[#FFF9FA] font-['Tajawal',system-ui,sans-serif] text-[#4A2C3A]"
    >
      <SiteHeader />
      <main className={`mx-auto w-full flex-1 px-4 py-6 md:py-10 ${maxWidth}`}>{children}</main>
      <footer className="border-t border-[#F3D5DD] py-6 text-center text-sm text-[#8C6F7B]">
        © {new Date().getFullYear()} velora. جميع الحقوق محفوظة.
      </footer>
    </div>
  );
}
