// src/pages/checklist/settings.tsx
import { useState, useEffect } from "react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/utils/supabaseClient";
import Image from "next/image";

export default function SettingsPage() {
  const { profile, loading } = useUserProfile();
  const [companyName, setCompanyName] = useState("");
  const [companyLogoUrl, setCompanyLogoUrl] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (profile) {
      setCompanyName(profile.company_name || "");
      setCompanyLogoUrl(profile.company_logo_url || "");
    }
  }, [profile]);

  const handleSave = async () => {
    setUpdating(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        company_name: companyName,
        company_logo_url: companyLogoUrl,
      })
      .eq("id", profile?.id);
    setUpdating(false);
    if (error) {
      alert("บันทึกไม่สำเร็จ: " + error.message);
    } else {
      alert("บันทึกสำเร็จ");
    }
  };

  if (loading || !profile) {
    return <div className="p-10 text-gray-600">กำลังโหลดข้อมูล...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">⚙️ ตั้งค่าระบบ</h1>

      <div className="space-y-6">
        <div>
          <label className="block font-semibold text-sm mb-1">ชื่อบริษัท</label>
          <input
            type="text"
            className="w-full border px-4 py-2 rounded"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
        </div>

        <div>
          <label className="block font-semibold text-sm mb-1">โลโก้บริษัท (URL)</label>
          <input
            type="text"
            className="w-full border px-4 py-2 rounded"
            value={companyLogoUrl}
            onChange={(e) => setCompanyLogoUrl(e.target.value)}
          />
        </div>

        {companyLogoUrl && (
          <div className="pt-4">
            <Image
              src={companyLogoUrl}
              alt="Company Logo"
              width={100}
              height={100}
              className="rounded"
            />
          </div>
        )}

        <div>
          <button
            onClick={handleSave}
            disabled={updating}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {updating ? "กำลังบันทึก..." : "💾 บันทึกการเปลี่ยนแปลง"}
          </button>
        </div>
      </div>
    </div>
  );
}
