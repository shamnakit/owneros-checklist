//src/contexts/UserProfileContext.tsx

import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useContext,
} from "react";
import { useRouter } from "next/router";
import { supabase } from "@/utils/supabaseClient";

/** Role ที่รองรับ */
export type Role = "owner" | "admin" | "member" | "auditor" | "partner";

/** โครงสร้างข้อมูลที่ UI ใช้ */
export type Profile = {
  id: string;

  full_name?: string | null;
  role?: Role | null;

  company_name: string | null;
  company_logo_url: string | null;
  company_logo_key: string | null;
  avatar_url?: string | null;

  updated_at?: string | null;

  revenue_band?: string | null;
  industry_section?: string | null; // TSIC/DBD A–U
  juristic_id?: string | null;      // 13 digit

  permissions?: string[];
};

/** รูปแบบแถวในตาราง profiles (ตรงกับคอลัมน์จริงใน DB) */
type ProfilesRow = {
  id: string;
  full_name: string | null;
  role: Role | null;

  company_name: string | null;
  company_logo_url: string | null;
  company_logo_key: string | null;
  avatar_url: string | null;

  updated_at: string | null;

  revenue_band: string | null;
  industry_section: string | null;
  juristic_id: string | null;

  permissions: string[] | null; // jsonb
};

type Ctx = {
  uid?: string | null;
  email?: string | null;
  profile: Profile | null;
  role?: Role | null;
  permissions?: string[];
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

export const UserProfileContext = createContext<Ctx>({
  uid: null,
  email: null,
  profile: null,
  role: null,
  permissions: [],
  loading: true,
  refresh: async () => {},
  logout: async () => {},
});

export const UserProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      const userId = user?.id || null;

      setUid(userId);
      setEmail(user?.email ?? null);

      if (!userId) {
        setProfile(null);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select(
          [
            "id",
            "full_name",
            "role",
            "company_name",
            "company_logo_url",
            "company_logo_key",
            "avatar_url",
            "updated_at",
            "revenue_band",
            "industry_section",
            "juristic_id",
            "permissions",
          ].join(",")
        )
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.warn("load profile error:", error);
        setProfile(null);
        return;
      }

      // ✅ แคสต์เป็นชนิดที่เรากำหนดเอง
      const row = (data ?? null) as Partial<ProfilesRow> | null;

      const normalized: Profile = {
        id: userId,

        full_name: row?.full_name ?? (user?.user_metadata as any)?.full_name ?? null,
        role: (row?.role as Role | null) ?? "owner",

        company_name: row?.company_name ?? null,
        company_logo_url: row?.company_logo_url ?? null,
        company_logo_key: row?.company_logo_key ?? null,
        avatar_url: row?.avatar_url ?? (user?.user_metadata as any)?.avatar_url ?? null,

        updated_at: row?.updated_at ?? null,

        revenue_band: row?.revenue_band ?? null,
        industry_section: row?.industry_section ?? null,
        juristic_id: row?.juristic_id ?? null,

        permissions: Array.isArray(row?.permissions) ? row?.permissions! : [],
      };

      setProfile(normalized);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();

    const { data: sub } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_OUT") {
        // เคลียร์ state และไปหน้า login (hard) — กัน state ค้างใน Chrome
        setProfile(null);
        setUid(null);
        setEmail(null);
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        } else {
          try {
            await router.replace("/login");
          } catch {
            /* noop */
          }
        }
      }

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        await load();
      }
    });

    return () => sub?.subscription?.unsubscribe?.();
  }, [load, router]);

  const logout = useCallback(async () => {
    try {
      // 1) ออกจากระบบ Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("logout error:", error);
      }

      // 2) ล้าง key ที่ Chrome มักค้าง (auth token ของ Supabase)
      try {
        // localStorage
        const lsKeys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i) || "";
          if (k.startsWith("sb-")) lsKeys.push(k);
        }
        lsKeys.forEach((k) => localStorage.removeItem(k));

        // sessionStorage
        const ssKeys: string[] = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const k = sessionStorage.key(i) || "";
          if (k.startsWith("sb-")) ssKeys.push(k);
        }
        ssKeys.forEach((k) => sessionStorage.removeItem(k));
      } catch {
        // ignore
      }

      // 3) รีเซ็ต state context
      setProfile(null);
      setUid(null);
      setEmail(null);

      // 4) hard redirect เพื่อกัน hydration/state ค้างใน Chrome
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      } else {
        await router.replace("/login");
      }
    } catch (e) {
      console.error("Logout fatal:", e);
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  }, [router]);

  const value = useMemo<Ctx>(() => {
    return {
      uid,
      email,
      profile,
      role: profile?.role ?? "owner",
      permissions: profile?.permissions ?? [],
      loading,
      refresh: load,
      logout,
    };
  }, [uid, email, profile, loading, load, logout]);

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
};

export const useUserProfile = () => useContext(UserProfileContext);
