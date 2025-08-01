import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";

export const useUserProfile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.id) {
      console.warn("ไม่พบ user จาก Supabase Auth:", userError);
      setProfile(null);
      setLoading(false);
      return;
    }

    const { data, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("โหลด profile ผิดพลาด:", profileError);
    }

    setProfile(data);
    setLoading(false);
  };

  useEffect(() => {
    loadProfile(); // initial load

    // ✅ เมื่อ session เปลี่ยน เช่น login สำเร็จ
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await loadProfile();
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return { profile, loading };
};
