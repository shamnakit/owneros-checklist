import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/utils/supabaseClient";

 export type Profile = {
   id: string;
   company_name: string | null;
   company_logo_url: string | null;
   company_logo_key: string | null;
   full_name?: string | null;  // ✅ เพิ่มเป็น optional
   role?: string | null;       // ✅ เพิ่มเป็น optional
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

export const UserProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
      const { data, error } = await supabase
        .from("profiles")
        .select("*")               // ✅ ดึงทุกคอลัมน์ (จะมีหรือไม่มีก็ไม่พัง)
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
    const { data: sub } = supabase.auth.onAuthStateChange((_e, _session) => load());
    return () => sub.subscription.unsubscribe();
  }, [load]);

  const value = useMemo(() => ({ profile, loading, refresh: load }), [profile, loading, load]);
  return <UserProfileContext.Provider value={value}>{children}</UserProfileContext.Provider>;
};
