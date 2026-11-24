// زرار واتساب عائم. يظهر فقط لو الرقم متحدد في VITE_WHATSAPP_NUMBER
// (بالصيغة الدولية بدون + أو أصفار، مثال: 201012345678).
const raw = import.meta.env.VITE_WHATSAPP_NUMBER || "";
const NUMBER = raw.replace(/\D/g, "");
const MESSAGE = "أهلاً Velora، عندي استفسار.";

export default function WhatsAppButton() {
  if (NUMBER.length < 10) return null;
  const href = `https://wa.me/${NUMBER}?text=${encodeURIComponent(MESSAGE)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="تواصل معنا عبر واتساب"
      className="fixed bottom-5 start-5 z-50 flex h-14 items-center gap-2 rounded-full bg-[#25D366] px-5 text-sm font-bold text-white shadow-lg transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2"
    >
      <svg viewBox="0 0 32 32" className="h-6 w-6 fill-current" aria-hidden="true">
        <path d="M16.04 3C9.4 3 4 8.4 4 15.03c0 2.12.55 4.18 1.6 6L4 29l8.14-1.56a12 12 0 0 0 3.9.65h.01C22.69 28.09 28 22.7 28 16.07 28 9.4 22.68 3 16.04 3zm0 22.1h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-4.83.93.96-4.7-.24-.38a9.9 9.9 0 0 1-1.52-5.3c0-5.5 4.5-9.97 10.03-9.97 5.52 0 10 4.47 10 9.98 0 5.5-4.49 9.03-8.99 9.03zm5.5-7.5c-.3-.15-1.78-.88-2.06-.98-.27-.1-.47-.15-.67.15-.2.3-.77.98-.95 1.18-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.78-1.67-2.08-.17-.3-.02-.46.13-.6.14-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.48.7.3 1.26.48 1.7.62.72.23 1.37.2 1.88.12.57-.08 1.78-.73 2.03-1.43.25-.7.25-1.3.17-1.43-.07-.12-.27-.2-.57-.35z" />
      </svg>
      واتساب
    </a>
  );
}
