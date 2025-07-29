// pages/checklist/settings.tsx
import { useUserProfile } from "@/hooks/useUserProfile";
import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabaseClient";


export default function SettingsPage() {
  const { profile, loading } = useUserProfile();
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setRole(profile.role || "");
    }
  }, [profile]);

  const handleSave = async () => {
    // จะใช้ Supabase update (คุณใช้ useUserProfile อยู่แล้ว)
    // สมมุติใช้ Supabase client ได้เลย:
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, role: role })
      .eq("id", profile.id);

    if (error) {
      alert("บันทึกไม่สำเร็จ");
    } else {
      alert("บันทึกสำเร็จ");
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <label className="block mb-2">ชื่อผู้ใช้</label>
      <input
        type="text"
        className="w-full border p-2 mb-4 rounded"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
      />

      <label className="block mb-2">ตำแหน่ง</label>
      <input
        type="text"
        className="w-full border p-2 mb-4 rounded"
        value={role}
        onChange={(e) => setRole(e.target.value)}
      />

      <button
        onClick={handleSave}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        บันทึกการเปลี่ยนแปลง
      </button>
    </div>
  );
}
