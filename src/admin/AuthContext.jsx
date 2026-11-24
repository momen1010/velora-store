// جلسة الأدمن: تسجيل دخول بالإيميل وكلمة السر + قراءة دور الأدمن من admins/{uid}.
// الدور هنا للعرض فقط. الحماية الفعلية في firestore.rules.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { PERMS } from "./lib/constants";

const AuthCtx = createContext(null);
const IDLE_MS = 30 * 60 * 1000; // خروج تلقائي بعد 30 دقيقة بدون نشاط

export function AuthProvider({ children }) {
  const [state, setState] = useState({ loading: true, user: null, admin: null });
  const [notice, setNotice] = useState("");
  const idle = useRef(null);

  useEffect(() => {
    if (!auth) { setState({ loading: false, user: null, admin: null }); return undefined; }
    return onAuthStateChanged(auth, async (user) => {
      if (!user) { setState({ loading: false, user: null, admin: null }); return; }
      try {
        const snap = await getDoc(doc(db, "admins", user.uid));
        if (!snap.exists() || snap.data().active !== true || !["owner", "manager", "staff"].includes(snap.data().role)) {
          setNotice("هذا الحساب ليس له صلاحية دخول للوحة الإدارة.");
          await signOut(auth);
          return;
        }
        setState({ loading: false, user, admin: { uid: user.uid, ...snap.data() } });
      } catch {
        setNotice("تعذّر التحقق من الصلاحيات. حاول مرة أخرى.");
        await signOut(auth);
      }
    });
  }, []);

  const logout = useCallback(async (msg) => {
    if (msg) setNotice(msg);
    try { await signOut(auth); } catch { /* تجاهل */ }
  }, []);

  // الخروج التلقائي عند الخمول
  useEffect(() => {
    if (!state.user) return undefined;
    const reset = () => {
      clearTimeout(idle.current);
      idle.current = setTimeout(() => logout("تم تسجيل خروجك تلقائياً لعدم النشاط."), IDLE_MS);
    };
    const evs = ["click", "keydown", "mousemove", "touchstart"];
    evs.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => { clearTimeout(idle.current); evs.forEach((e) => window.removeEventListener(e, reset)); };
  }, [state.user, logout]);

  const login = useCallback(async (email, password) => {
    setNotice("");
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }, []);
  const resetPassword = useCallback((email) => sendPasswordResetEmail(auth, email.trim()), []);

  const value = useMemo(() => ({
    ...state, notice, setNotice, login, logout, resetPassword,
    can: (area) => Boolean(state.admin && (PERMS[area] ?? []).includes(state.admin.role)),
  }), [state, notice, login, logout, resetPassword]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAdminAuth = () => useContext(AuthCtx);
