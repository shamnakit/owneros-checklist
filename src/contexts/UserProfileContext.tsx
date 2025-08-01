import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";

// ✅ กำหนด type สำหรับ profile
type Profile = {
  id: string;
  full_name?: string;
  avatar_url?: string;
  company_logo_url?: string;
  company_name?: string;
  position?: string; // ✅ เพิ่มตำแหน่งของผู้ใช้
};

// ✅ กำหนดรูปแบบ context
type UserProfileContextType = {
  profile: Profile | null;
  setProfile: React.Dispatch<React.SetStateAction<Profile | null>>;
  loading: boolean;
};

// ✅ สร้าง context
const UserProfileContext = createContext<UserProfileContextType | null>(null);

// ✅ Provider สำหรับใช้ครอบแอป
export const UserProfileProvider = ({ children }: { children: React.ReactNode }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;

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

    load();
  }, []);

  return (
    <UserProfileContext.Provider value={{ profile, setProfile, loading }}>
      {children}
    </UserProfileContext.Provider>
  );
};

// ✅ hook สำหรับเรียกใช้งาน context
export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error("useUserProfile must be used within a UserProfileProvider");
  }
  return context;
};
