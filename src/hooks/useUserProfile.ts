// src/hooks/useUserProfile.ts
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/utils/supabaseClient";

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role?: string | null;
  company_name?: string | null;
  company_logo_url?: string | null;
  company_logo_key?: string | null;   // 👈 เพิ่ม
  created_at?: string;
  updated_at?: string;
};

export function useUserProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: u, error: uErr } = await supabase.auth.getUser();
      if (uErr) throw uErr;
      const user = u.user;
      if (!user) { setProfile(null); setLoading(false); return; }

      const uid = user.id;

      // 1) พยายามโหลด (กัน 406)
      let { data: p, error: pErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", uid)
        .maybeSingle();
      if (pErr) throw pErr;

      // 2) ยังไม่มี → upsert สร้าง แล้วโหลดใหม่
      if (!p) {
        const payload = {
  id: uid,
  email: user.email ?? null,
  full_name: (user.user_metadata?.full_name || user.user_metadata?.name) ?? null,
  avatar_url: user.user_metadata?.avatar_url ?? null,
  company_name: user.user_metadata?.company_name ?? null,
  company_logo_url: user.user_metadata?.company_logo_url ?? null, // 👈 เพิ่ม
};

        const { error: iErr } = await supabase
          .from("profiles")
          .upsert(payload, { onConflict: "id", ignoreDuplicates: false });
        if (iErr) throw iErr;

        const { data: p2, error: p2Err } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", uid)
          .single();
        if (p2Err) throw p2Err;
        p = p2;
      }

      setProfile(p as Profile);
    } catch (e: any) {
      setError(e?.message ?? "โหลดโปรไฟล์ไม่สำเร็จ");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // รีเฟรชเมื่อ auth state เปลี่ยน
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(() => { refresh(); });
    return () => { sub?.subscription?.unsubscribe(); };
  }, [refresh]);

  return { profile, loading, error, refresh };
}
