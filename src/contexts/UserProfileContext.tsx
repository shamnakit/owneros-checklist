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

export type Profile = {
  id: string;
  company_name: string | null;
  company_logo_url: string | null;
  company_logo_key: string | null;

  // optional fields for UI
  full_name?: string | null;
  position?: string | null;
  role?: string | null;
  avatar_url?: string | null;

  created_at?: string | null;
  updated_at?: string | null;
};

type Ctx = {
  profile: Profile | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

export const UserProfileContext = createContext<Ctx>({
  profile: null,
  loading: true,
  refresh: async () => {},
  logout: async () => {},
});

export const UserProfileProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;

      if (!uid) {
        setProfile(null); // ยังไม่ล็อกอิน
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", uid)
        .maybeSingle();

      if (error) {
        console.warn("load profile error:", error);
        setProfile(null);
        return;
      }

      const fallback: Profile = {
        id: uid,
        company_name: null,
        company_logo_url: null,
        company_logo_key: null,
        full_name: null,
        position: null,
        role: null,
        avatar_url: null,
        created_at: null,
        updated_at: null,
      };

      setProfile((data as Profile) ?? fallback);
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
        // กันหลงอยู่หน้าที่ต้อง auth
        try {
          await router.replace("/login");
        } catch {}
      }
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
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
    try {
      await router.replace("/login");
    } catch {
      if (typeof window !== "undefined") {
        window.location.assign("/login");
      }
    }
  }, [router]);

  const value = useMemo(
    () => ({ profile, loading, refresh: load, logout }),
    [profile, loading, load, logout]
  );

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
};

export const useUserProfile = () => useContext(UserProfileContext);
