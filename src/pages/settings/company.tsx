// pages/settings/company.tsx
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/utils/supabaseClient";
import RevenueBandSelector, { RevenueBandValue, labelFromValue } from "@/components/setting/RevenueBandSelector";

import Head from "next/head";

type ProfileRow = {
  id: string;
  company_name: string | null;
  company_logo_url: string | null;
  industry_code: string | null;
  company_size_band: string | null;
  employee_count: number | null;
  standards: string[] | null; // jsonb
  default_year: number | null;
  revenue_band: RevenueBandValue | null; // ← ฟิลด์ใหม่
};

export default function CompanySettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileRow | null>(null);

  // ฟิลด์ที่แสดงในฟอร์ม (ตัวอย่างเฉพาะ revenue_band)
  const [companyName, setCompanyName] = useState("");
  const [revenueBand, setRevenueBand] = useState<RevenueBandValue | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, company_name, company_logo_url, industry_code, company_size_band, employee_count, standards, default_year, revenue_band"
      )
      .eq("id", uid)
      .single();

    if (error) {
      console.error("โหลดโปรไฟล์บริษัทผิดพลาด:", error);
    } else {
      setProfile(data as ProfileRow);
      setCompanyName((data?.company_name as string) || "");
      setRevenueBand(
        (data?.revenue_band as RevenueBandValue | null) ?? null
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onSave = useCallback(async () => {
    if (!profile?.id) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        company_name: companyName || null,
        revenue_band: revenueBand || null,
      })
      .eq("id", profile.id);

    setSaving(false);

    if (error) {
      console.error("บันทึกไม่สำเร็จ:", error);
      alert("บันทึกไม่สำเร็จ กรุณาลองใหม่");
      return;
    }
    alert("บันทึกโปรไฟล์บริษัทแล้ว");
    fetchProfile();
  }, [companyName, revenueBand, profile?.id, fetchProfile]);

  return (
    <>
      <Head>
        <title>Settings – Company | OwnerOS</title>
      </Head>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-2">Settings</h1>
        <div className="text-gray-500 mb-6">Company Profile</div>

        {loading ? (
          <div className="text-gray-500">กำลังโหลด...</div>
        ) : (
          <div className="space-y-8">
            {/* ชื่อบริษัท (ตัวอย่าง) */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">ชื่อบริษัท</label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="เช่น บริษัท เอ บี ซี จำกัด"
              />
            </div>

            {/* Revenue Band */}
            <div className="space-y-3">
              <label className="block text-sm font-medium">
                ยอดขายต่อปี (Revenue Band)
              </label>
              <RevenueBandSelector
                value={revenueBand}
                onChange={setRevenueBand}
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                สถานะ:
                <span className="ml-1 font-medium">
                  {revenueBand ? labelFromValue(revenueBand) : "ยังไม่เลือก"}
                </span>
              </div>
              <button
                onClick={onSave}
                disabled={saving}
                className="inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {saving ? "กำลังบันทึก..." : "Save"}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
