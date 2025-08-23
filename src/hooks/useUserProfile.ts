import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/utils/supabaseClient";

export type UserProfile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
};

type State = {
  loading: boolean;
  error: string | null;
  profile: UserProfile | null;
};

export function useUserProfile() {
  const [state, setState] = useState<State>({
    loading: true,
    error: null,
    profile: null,
  });

  const fetchProfile = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      setState({ loading: false, error: userErr?.message ?? "No user", profile: null });
      return;
    }

    const user = userData.user;
    const fallbackName =
      (user.user_metadata as any)?.full_name || user.user_metadata?.name || user.email || null;
    const fallbackAvatar = (user.user_metadata as any)?.avatar_url ?? null;

    // ดึงจากตาราง profiles (ถ้ามี record)
    const { data: row, error } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      // ถ้าอ่านไม่ได้ (policy/column/ตาราง) ให้ใช้ metadata แทน เพื่อไม่ให้ UI ว่าง
      setState({
        loading: false,
        error: null, // ซ่อน error เพื่อ UX ที่ดีกว่า (ดู log ได้จาก network/console)
        profile: {
          id: user.id,
          full_name: fallbackName,
          avatar_url: fallbackAvatar,
          email: user.email ?? null,
        },
      });
      return;
    }

    setState({
      loading: false,
      error: null,
      profile: {
        id: user.id,
        full_name: row?.full_name ?? fallbackName,
        avatar_url: row?.avatar_url ?? fallbackAvatar,
        email: user.email ?? null,
      },
    });
  }, []);

  useEffect(() => {
    fetchProfile();

    // รีเฟรชเมื่อมีการเปลี่ยนสถานะ auth (login/logout/token refresh)
    const { data: sub } = supabase.auth.onAuthStateChange((_event) => {
      fetchProfile();
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // อัปเดตฟิลด์ในตาราง profiles (ถ้าเปิดสิทธิ์ RLS แล้ว)
  const updateProfile = useCallback(
    async (patch: Partial<Pick<UserProfile, "full_name" | "avatar_url">>) => {
      if (!state.profile) return;
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: patch.full_name ?? state.profile.full_name,
          avatar_url: patch.avatar_url ?? state.profile.avatar_url,
        })
        .eq("id", state.profile.id);
      if (error) throw error;
      await fetchProfile();
    },
    [state.profile, fetchProfile]
  );

  return {
    loading: state.loading,
    error: state.error,
    profile: state.profile,
    refresh: fetchProfile,
    updateProfile,
  };
}

export default useUserProfile;
