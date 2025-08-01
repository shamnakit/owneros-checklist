import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";

export const useUserProfile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
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

    fetchProfile();
  }, []);

  return { profile, loading };
};
