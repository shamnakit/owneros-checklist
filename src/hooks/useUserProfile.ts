import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";

export type Profile = {
  id: string;
  full_name?: string | null;
  company_name?: string | null;
  company_logo_url?: string | null;
  company_logo_key?: string | null;  // ✅ เพิ่มฟิลด์นี้
  role?: string | null;
};

// ---- module-level cache เพื่อลดการกระพริบ loading ----
let cachedProfile: Profile | null = null;
let loadedOnce = false;

export function useUserProfile() {
  const [profile, setProfile] = useState<Profile | null>(cachedProfile);
  const [loading, setLoading] = useState<boolean>(!loadedOnce);

  const refresh = useCallback(async (): Promise<Profile | null> => {
    setLoading(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const user = u.user;
      if (!user) {
        cachedProfile = null;
        loadedOnce = true;
        setProfile(null);
        return null;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!error && data) {
        cachedProfile = data as Profile;
        setProfile(cachedProfile);
        loadedOnce = true;
        return cachedProfile;
      } else {
        loadedOnce = true;
        return null;
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!loadedOnce) {
        await refresh();
      } else {
        setLoading(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      cachedProfile = null;
      loadedOnce = false;
      refresh();
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, [refresh]);

  return { profile, loading, refresh };
}
