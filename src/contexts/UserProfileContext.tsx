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

/** โพรไฟล์ตาม schema ของ DB */
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
  permissions?: string[]; // jsonb -> array
};

type Ctx = {
  /** auth */
  uid?: string | null;
  email?: string | null;

  /** profile row */
  profile: Profile | null;

  /** access control */
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
        setProfile(null);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
          id,
          full_name,
          role,
          company_name,
          company_logo_url,
          company_logo_key,
          avatar_url,
          updated_at,
          revenue_band,
          permissions
        `
        )
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.warn("load profile error:", error);
        setProfile(null);
        return;
      }

      const normalized: Profile = {
        id: userId,
        full_name: data?.full_name ?? (user?.user_metadata as any)?.full_name ?? null,
        role: (data?.role as Role | null) ?? "owner", // fallback owner
        company_name: data?.company_name ?? null,
        company_logo_url: data?.company_logo_url ?? null,
        company_logo_key: data?.company_logo_key ?? null,
        avatar_url: data?.avatar_url ?? (user?.user_metadata as any)?.avatar_url ?? null,
        updated_at: data?.updated_at ?? null,
        revenue_band: data?.revenue_band ?? null,
        permissions: Array.isArray(data?.permissions) ? data?.permissions : [],
      };

      setProfile(normalized);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ ฟังสถานะ auth
  useEffect(() => {
    load();
    const { data: sub } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_OUT") {
        setProfile(null);
        setUid(null);
        setEmail(null);
        try {
          await router.replace("/login");
        } catch {
          if (typeof window !== "undefined") {
            window.location.assign("/login");
          }
        }
      }
      if (
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED" ||
        event === "USER_UPDATED"
      ) {
        await load();
      }
    });
    return () => sub?.subscription?.unsubscribe?.();
  }, [load, router]);

  // ✅ logout รวมศูนย์
  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("logout error:", error);
      throw error;
    }
    setProfile(null);
    setUid(null);
    setEmail(null);

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

/** ✅ Hook ใช้งานจริง */
export const useUserProfile = () => useContext(UserProfileContext);
