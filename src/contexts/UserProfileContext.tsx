import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useContext,
} from "react";
import { supabase } from "@/utils/supabaseClient";

export type Profile = {
  id: string;
  company_name: string | null;
  company_logo_url: string | null;
  company_logo_key: string | null;

  // ฟิลด์ที่ UI อาจใช้ (optional)
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
};

export const UserProfileContext = createContext<Ctx>({
  profile: null,
  loading: true,
  refresh: async () => {},
});

export const UserProfileProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
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
        .maybeSingle(); // ถ้ายังไม่มีแถว → data = null (ไม่ 406)

      if (error) {
        console.warn("load profile error:", error);
        setProfile(null);
        return;
      }

      // ✅ ถ้ายังไม่มีแถวใน DB ให้ปล่อย "โปรไฟล์ว่าง" (fallback) เพื่อให้ UI ทำงานต่อได้
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

  useEffect(() => {
    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => sub.subscription.unsubscribe();
  }, [load]);

  const value = useMemo(
    () => ({ profile, loading, refresh: load }),
    [profile, loading, load]
  );

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
};

// ให้ไฟล์อื่น import hook นี้ได้โดยตรง
export const useUserProfile = () => useContext(UserProfileContext);
