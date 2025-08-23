// src/contexts/UserProfileContext.tsx
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

/** อนุญาต role ตามที่ Sidebar ใช้ */
export type Role = "owner" | "admin" | "member" | "auditor" | "partner";

/** โพรไฟล์ที่ UI ใช้ */
export type Profile = {
  id: string;
  company_name: string | null;
  company_logo_url: string | null;
  company_logo_key: string | null;

  // optional fields for UI
  full_name?: string | null;
  position?: string | null;      // map จาก position_title
  role?: Role | null;
  avatar_url?: string | null;

  // access control
  permissions?: string[] | null;

  created_at?: string | null;
  updated_at?: string | null;
};

/** shape ที่คาดหวังจาก DB (ชื่อคอลัมน์ตรง schema) */
type ProfilesPick = {
  id: string;
  company_name: string | null;
  company_logo_url: string | null;
  company_logo_key: string | null;
  full_name: string | null;
  position_title: string | null;
  role: Role | null;
  avatar_url: string | null;
  permissions: string[] | null; // jsonb
  created_at: string | null;
  updated_at: string | null;
};

type Ctx = {
  /** auth */
  uid?: string | null;
  email?: string | null;

  /** profile row */
  profile: Profile | null;

  /** access control (ดึงซ้ำไว้ให้ใช้สะดวก) */
  role?: Role | null;
  permissions?: string[]; // normalize เป็น array เสมอ

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

export const UserProfileProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
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
        setProfile(null); // ยังไม่ล็อกอิน
        return;
      }

      // ❗️ไม่ใช้ generic กับ select — ให้ TS มองเป็น unknown ก่อน
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, company_name, company_logo_url, company_logo_key, full_name, position_title, role, avatar_url, permissions, created_at, updated_at"
        )
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.warn("load profile error:", error);
        setProfile(null);
        return;
      }

      // safe cast เป็น Partial<ProfilesPick> ก่อน
      const row = (data ?? null) as Partial<ProfilesPick> | null;

      const normalized: Profile = {
  id: userId,
  company_name: data?.company_name ?? null,
  company_logo_url: data?.company_logo_url ?? null,
  company_logo_key: data?.company_logo_key ?? null,

  full_name: data?.full_name ?? (user?.user_metadata as any)?.full_name ?? null,
  position: data?.position_title ?? null,

  // 👇 ถ้าไม่มี role ใน DB → fallback เป็น "owner"
  role: (data?.role as Role | null) ?? "owner",

  avatar_url: data?.avatar_url ?? (user?.user_metadata as any)?.avatar_url ?? null,

  // 👇 ถ้าไม่มี permissions → ให้เป็น array ว่าง
  permissions: Array.isArray(data?.permissions) ? data?.permissions : [],

  created_at: data?.created_at ?? null,
  updated_at: data?.updated_at ?? null,
};


      setProfile(normalized);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ ฟังสถานะ auth เพื่ออัปเดต UI และ redirect อัตโนมัติ
  useEffect(() => {
    load();
    const { data: sub } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_OUT") {
        setProfile(null);
        setUid(null);
        setEmail(null);
        // กันหลงอยู่หน้าที่ต้อง auth
        try {
          await router.replace("/login");
        } catch {
          if (typeof window !== "undefined") window.location.assign("/login");
        }
      }
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        await load();
      }
    });
    return () => sub?.subscription?.unsubscribe?.();
  }, [load, router]);

  // ✅ ฟังก์ชัน logout รวมศูนย์
  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("logout error:", error);
      throw error;
    }
    setProfile(null);
    setUid(null);
    setEmail(null);

    // ล้าง cache sb-* กัน token ค้าง
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i) || "";
        if (k.startsWith("sb-")) keys.push(k);
      }
      keys.forEach((k) => localStorage.removeItem(k));
    } catch {}

    try {
      await router.replace("/login");
    } catch {
      if (typeof window !== "undefined") {
        window.location.assign("/login");
      }
    }
  }, [router]);

  const value = useMemo<Ctx>(() => {
    const perms = (profile?.permissions ?? []) as string[];
    return {
      uid,
      email,
      profile,
      role: profile?.role ?? null,
      permissions: perms,
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
