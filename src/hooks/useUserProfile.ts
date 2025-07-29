import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";

export const useUserProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        setProfile(data);
      }
      setLoading(false);
    };

    fetchProfile();
  }, []);

  return { profile, loading };
};
