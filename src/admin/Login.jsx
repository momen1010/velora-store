import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { useAdminAuth } from "./AuthContext";
import { btnPrimary, inputCls, Field } from "./components/ui";

const authError = (e) => {
  const c = e?.code ?? "";
  if (c.includes("too-many-requests")) return "محاولات كثيرة. انتظر قليلاً ثم حاول مرة أخرى.";
  if (c.includes("network")) return "مشكلة في الاتصال بالإنترنت.";
  if (c.includes("configuration-not-found") || c.includes("operation-not-allowed")) return "تسجيل الدخول غير مفعّل في Firebase بعد.";
  return "الإيميل أو كلمة السر غير صحيحة."; // رسالة واحدة حتى لا نكشف وجود الحساب
};

export default function Login() {
  const { user, admin, loading, login, notice, resetPassword } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  if (!loading && user && admin) return <Navigate to="/admin" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(""); setInfo("");
    try { await login(email, password); } catch (err) { setError(authError(err)); } finally { setBusy(false); }
  };
  const forgot = async () => {
    setError(""); setInfo("");
    if (!email) { setError("اكتب الإيميل أولاً."); return; }
    try { await resetPassword(email); } catch { /* لا نكشف وجود الحساب */ }
    setInfo("لو الإيميل مسجّل، هيوصلك رابط لتغيير كلمة السر.");
  };

  return (
    <div dir="rtl" className="flex min-h-screen items-center justify-center bg-stone-50 px-4 font-['Tajawal',system-ui,sans-serif]">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="text-center">
          <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-stone-900 text-white"><Lock className="h-5 w-5" aria-hidden="true" /></span>
          <h1 className="text-xl font-bold text-stone-900">لوحة تحكم Velora</h1>
          <p className="mt-1 text-sm text-stone-500">دخول الإدارة فقط</p>
        </div>
        {(notice || error) && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error || notice}</p>}
        {info && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{info}</p>}
        <Field label="الإيميل"><input className={inputCls} dir="ltr" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="كلمة السر"><input className={inputCls} dir="ltr" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        <button disabled={busy || loading} className={`${btnPrimary} w-full`}>{busy ? "جارٍ الدخول..." : "تسجيل الدخول"}</button>
        <button type="button" onClick={forgot} className="w-full text-center text-sm text-stone-500 hover:text-stone-900">نسيت كلمة السر؟</button>
      </form>
    </div>
  );
}
