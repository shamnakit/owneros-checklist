// src/pages/admin/login.tsx
import React, { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { supabase } from "@/utils/supabaseClient";
import { Lock, LogIn, Mail, KeyRound, Shield } from "lucide-react";

/**
 * Admin Login Page (Platform Admin)
 * - URL: /admin/login
 * - ไม่มี Sidebar (กำหนดใน _app.tsx แล้ว)
 * - Flow:
 *   1) ถ้ามี session → ดึง/สร้าง profiles แล้วเช็ก role=admin
 *   2) Email/Password หรือ Google SSO
 *   3) หลังล็อกอิน → เช็ก role=admin ก่อนเข้า /admin/*
 */

// อนุญาต redirect เฉพาะ path ที่ขึ้นต้นด้วย /admin เพื่อกัน open-redirect
const getSafeCallback = (raw?: string) => {
  if (typeof raw !== "string") return "/admin";
  return raw.startsWith("/admin") ? raw : "/admin";
};

export default function AdminLoginPage() {
  const router = useRouter();
  const callback = getSafeCallback(router.query.callback as string);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // helper: ดึง role; ถ้าไม่พบแถว profiles จะ upsert ให้เป็น 'user' แล้วคืน role กลับมา
  const fetchOrCreateRole = async (uid: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", uid)
      .maybeSingle();

    if (error) throw error;
    if (data?.role) return data.role as string;

    const { data: up, error: ue } = await supabase
      .from("profiles")
      .upsert({ id: uid, role: "user" })
      .select("role")
      .single();

    if (ue) throw ue;
    return up.role as string;
  };

  const checkAdminAndGo = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    try {
      const role = await fetchOrCreateRole(session.user.id);
      if (role === "admin") {
        router.replace(callback);
      } else {
        setError("บัญชีนี้ไม่มีสิทธิ์ Platform Admin");
        await supabase.auth.signOut();
      }
    } catch {
      setError("โหลดสิทธิ์ผู้ใช้ไม่สำเร็จ");
    }
  };

  // ถ้ามี session อยู่แล้ว → เช็ก role = admin → เด้งเข้า callback
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await checkAdminAndGo();
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callback]);

  const onEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await checkAdminAndGo();
    } catch (err: any) {
      setError(err?.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}${callback}` }, // callback ผ่าน sanitize แล้ว
      });
      if (error) throw error;
      // กลับมาจาก OAuth แล้ว useEffect จะเรียก checkAdminAndGo ให้อัตโนมัติ
    } catch (err: any) {
      setError(err?.message || "Google SSO ล้มเหลว");
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Admin Login • Bizzystem</title>
      </Head>

      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
        {/* Left: Branding */}
        <div className="hidden lg:flex bg-gradient-to-br from-violet-700 to-fuchsia-600 text-white p-10">
          <div className="max-w-md self-center">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/20" />
              <div>
                <div className="text-xl font-semibold tracking-tight">bizzystem Admin</div>
                <div className="text-sm text-white/80">Platform Control • Investor-Ready</div>
              </div>
            </div>

            <div className="mt-10 space-y-4 text-white/90">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5" /> RBAC & 2FA ready
              </div>
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5" /> Evidence-first Governance
              </div>
              <div className="flex items-center gap-3">
                <KeyRound className="h-5 w-5" /> Audit Log & Exports
              </div>
            </div>
          </div>
        </div>

        {/* Right: Login Card — โทนสว่างอ่านง่าย */}
        <div className="flex items-center justify-center p-6 lg:p-10 bg-zinc-100">
          <div className="w-full max-w-md rounded-2xl bg-white text-zinc-900 ring-1 ring-black/5 shadow-sm p-6">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600" />
              <div>
                <h1 className="text-lg font-semibold">เข้าสู่ระบบสำหรับผู้ดูแลแพลตฟอร์ม</h1>
                <p className="text-xs text-zinc-500">
                  เฉพาะ Platform Admin ของ bizzystem เท่านั้น
                </p>
              </div>
            </div>

            <form onSubmit={onEmailLogin} className="mt-6 space-y-3">
              <div>
                <label className="text-xs text-zinc-500">อีเมล</label>
                <div className="mt-1 flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2">
                  <Mail className="h-4 w-4 text-zinc-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@bizzystem.com"
                    className="w-full bg-transparent outline-none text-sm text-zinc-900 placeholder-zinc-500"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-500">รหัสผ่าน</label>
                <div className="mt-1 flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2">
                  <KeyRound className="h-4 w-4 text-zinc-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-transparent outline-none text-sm text-zinc-900 placeholder-zinc-500"
                    autoComplete="current-password"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs px-3 py-2">
                  {error}
                </div>
              )}
              {info && (
                <div className="rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs px-3 py-2">
                  {info}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 text-white px-4 py-2 text-sm hover:bg-violet-700 disabled:opacity-60"
              >
                <LogIn className="h-4 w-4" /> เข้าสู่ระบบ
              </button>

              <button
                type="button"
                onClick={onGoogle}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 py-2 text-sm hover:bg-zinc-50 disabled:opacity-60"
              >
                <img src="https://www.google.com/favicon.ico" className="h-4 w-4" alt="" />
                Sign in with Google
              </button>

              <p className="text-[11px] text-zinc-500 mt-2">
                หมายเหตุ: บัญชีนี้ต้องได้รับสิทธิ์ <b>Platform Admin</b> จึงจะเข้าหน้า Admin ได้
              </p>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
