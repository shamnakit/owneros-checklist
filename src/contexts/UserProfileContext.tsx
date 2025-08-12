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

  // ฟิลด์ที่ Sidebar/หน้าอื่นอาจใช้ — ทำเป็น optional ไว้ก่อน
  full_name?: string | null;
  position?: string | null;
  role?: string | null;
  avatar_url?: string | null;

  // เผื่อมี timestamp ในตาราง
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
        setProfile(null);
        return;
      }

      // ✅ ใช้ .maybeSingle() กัน 406 ถ้ายังไม่มีแถว
      // ✅ select("*") เพื่อดึงทุกคอลัมน์ที่อาจมี (type เรารองรับแบบ optional)
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", uid)
        .maybeSingle();

      if (error) {
        console.warn("load profile error:", error);
        setProfile(null);
      } else {
        setProfile((data as Profile) ?? null);
      }
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

// ✅ ให้ import ได้จากไฟล์นี้โดยตรง
export const useUserProfile = () => useContext(UserProfileContext);
