// src/components/checklist/SettingsPage.tsx
import { useEffect, useState } from "react";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { supabase } from "@/utils/supabaseClient";

export default function SettingsPage() {
  const { profile, loading, refresh } = useUserProfile();

  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setCompanyName(profile.company_name || "");
      setRole(profile.role || "");
    }
  }, [profile]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setMsg(null);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName || null,
          company_name: companyName || null,
          role: role || null,
        })
        .eq("id", profile.id);
      if (error) throw error;

      setMsg("บันทึกสำเร็จ ✓");
      await refresh();
    } catch (e: any) {
      setMsg(`บันทึกไม่สำเร็จ: ${e.message ?? "unknown error"}`);
      // eslint-disable-next-line no-console
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !profile) {
    return <div className="p-6 text-gray-500">กำลังโหลดโปรไฟล์…</div>;
    }

  return (
    <div className="max-w-xl p-6 space-y-4 bg-white rounded-xl border shadow-sm">
      <h1 className="text-2xl font-bold">การตั้งค่าโปรไฟล์</h1>

      <label className="block">
        <span className="text-sm text-gray-700">ชื่อ–นามสกุล</span>
        <input
          type="text"
          className="mt-1 w-full border rounded-md p-2"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="เช่น กิติศักดิ์ ใจดี"
        />
      </label>

      <label className="block">
        <span className="text-sm text-gray-700">ชื่อบริษัท</span>
        <input
          type="text"
          className="mt-1 w-full border rounded-md p-2"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="เช่น เจ้าของกิจการ จำกัด"
        />
      </label>

      <label className="block">
        <span className="text-sm text-gray-700">บทบาท (Role)</span>
        <input
          type="text"
          className="mt-1 w-full border rounded-md p-2"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="เช่น Owner, Co-founder, Manager"
        />
      </label>

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "กำลังบันทึก…" : "บันทึก"}
        </button>
        {msg && <span className="text-sm text-gray-600">{msg}</span>}
      </div>
    </div>
  );
}
