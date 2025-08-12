// src/pages/checklist/settings.tsx
import { useState, useEffect } from "react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/utils/supabaseClient";
import Image from "next/image";

function slugify(filename: string) {
  const i = filename.lastIndexOf(".");
  const base = (i >= 0 ? filename.slice(0, i) : filename)
    .toLowerCase()
    .replace(/[^a-z0-9ก-๙_\- ]+/gi, "")
    .trim()
    .replace(/\s+/g, "-");
  const ext = i >= 0 ? filename.slice(i).toLowerCase() : "";
  return `${base}${ext}`;
}

export default function SettingsPage() {
  const { profile, loading, refresh } = useUserProfile();

  const [companyName, setCompanyName] = useState("");
  const [companyLogoUrl, setCompanyLogoUrl] = useState("");
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (profile) {
      setCompanyName(profile.company_name || "");
      setCompanyLogoUrl(profile.company_logo_url || "");
    }
  }, [profile]);

  const handleSave = async () => {
    if (!profile) return;
    setUpdating(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        company_name: companyName || null,
        company_logo_url: companyLogoUrl || null,
        // company_logo_key ไม่แตะ ถ้าเป็น URL ภายนอก
      })
      .eq("id", profile.id);

    setUpdating(false);

    if (error) {
      alert("บันทึกไม่สำเร็จ: " + error.message);
    } else {
      await refresh();
      alert("บันทึกสำเร็จ");
    }
  };

  const handleLogoUpload = async (file: File) => {
    if (!profile) return;

    // ตรวจสอบชนิด/ขนาดไฟล์
    if (!file.type.startsWith("image/")) {
      alert("อนุญาตเฉพาะไฟล์ภาพเท่านั้น");
      return;
    }
    const maxSizeMB = 5;
    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`ไฟล์ใหญ่เกินไป (จำกัด ${maxSizeMB}MB)`);
      return;
    }

    setUploading(true);
    try {
      // ใช้ auth.uid() เป็น prefix
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) {
        alert("ไม่พบ session ผู้ใช้");
        return;
      }

      const key = `${uid}/logo/${Date.now()}-${slugify(file.name)}`;
      // อัปโหลดเข้า bucket public-assets
      const { error: upErr } = await supabase.storage
        .from("public-assets")
        .upload(key, file, { upsert: true, contentType: file.type });
      if (upErr) {
        alert("อัปโหลดไม่สำเร็จ: " + upErr.message);
        return;
      }

      // ได้ URL สาธารณะ
      const { data: pub } = supabase.storage
        .from("public-assets")
        .getPublicUrl(key);
      const url = pub?.publicUrl || "";

      // อัปเดตโปรไฟล์ให้ชี้โลโก้ใหม่
      const { error: updErr } = await supabase
        .from("profiles")
        .update({
          company_logo_url: url,
          company_logo_key: key,
        })
        .eq("id", profile.id);
      if (updErr) {
        alert("บันทึกโลโก้ไม่สำเร็จ: " + updErr.message);
        return;
      }

      // ลบไฟล์เก่า (ถ้ามีและเป็นของเรา)
      if (profile.company_logo_key) {
        await supabase.storage.from("public-assets").remove([profile.company_logo_key]);
      }

      setCompanyLogoUrl(url);
      await refresh();
      alert("อัปโหลดโลโก้สำเร็จ");
    } finally {
      setUploading(false);
    }
  };

  const handleLogoDelete = async () => {
    if (!profile) return;
    setUploading(true);
    try {
      // ลบไฟล์ใน bucket ถ้ามี key
      if (profile.company_logo_key) {
        const { error: delErr } = await supabase
          .from("profiles")
          .update({ company_logo_url: null, company_logo_key: null })
          .eq("id", profile.id);
        if (delErr) {
          alert("อัปเดตโปรไฟล์ไม่สำเร็จ: " + delErr.message);
          return;
        }

        const { error: sErr } = await supabase.storage
          .from("public-assets")
          .remove([profile.company_logo_key]);
        if (sErr) {
          // ไม่ถึงกับต้อง fail ทั้ง flow — แจ้งเตือนเฉยๆ
          console.warn("ลบไฟล์เก่าไม่ได้:", sErr);
        }
      } else {
        // ไม่มี key → แค่ล้าง URL
        const { error: updErr } = await supabase
          .from("profiles")
          .update({ company_logo_url: null })
          .eq("id", profile.id);
        if (updErr) {
          alert("อัปเดตโปรไฟล์ไม่สำเร็จ: " + updErr.message);
          return;
        }
      }

      setCompanyLogoUrl("");
      await refresh();
      alert("ลบโลโก้สำเร็จ");
    } finally {
      setUploading(false);
    }
  };

  if (loading || !profile) {
    return <div className="p-10 text-gray-600">กำลังโหลดข้อมูล...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">⚙️ ตั้งค่าระบบ</h1>

      <div className="space-y-6">
        {/* ชื่อบริษัท */}
        <div>
          <label className="block font-semibold text-sm mb-1">ชื่อบริษัท</label>
          <input
            type="text"
            className="w-full border px-4 py-2 rounded"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="เช่น เจ้าของกิจการ จำกัด"
          />
        </div>

        {/* โลโก้บริษัท (อัปโหลด & URL สำรอง) */}
        <div className="space-y-3">
          <label className="block font-semibold text-sm">โลโก้บริษัท</label>

          {/* ปุ่มอัปโหลด */}
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded bg-slate-100 hover:bg-slate-200 cursor-pointer">
              {uploading ? "กำลังอัปโหลด..." : "📤 อัปโหลดโลโก้"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleLogoUpload(f);
                  e.currentTarget.value = "";
                }}
                disabled={uploading}
              />
            </label>

            {companyLogoUrl && (
              <button
                onClick={handleLogoDelete}
                disabled={uploading}
                className="px-3 py-2 rounded bg-red-50 text-red-600 hover:bg-red-100"
                title="ลบโลโก้"
              >
                🗑️ ลบโลโก้
              </button>
            )}
          </div>

          {/* ป้อน URL เอง (ทางเลือก) */}
          <div>
            <label className="block font-semibold text-xs text-gray-600 mb-1">
              หรือใส่ URL
            </label>
            <input
              type="url"
              className="w-full border px-4 py-2 rounded"
              value={companyLogoUrl}
              onChange={(e) => setCompanyLogoUrl(e.target.value)}
              placeholder="เช่น https://.../logo.png"
            />
          </div>

          {/* พรีวิว */}
          {companyLogoUrl && (
            <div className="pt-2">
              <Image
                src={companyLogoUrl}
                alt="Company Logo"
                width={140}
                height={140}
                className="rounded border"
              />
            </div>
          )}
        </div>

        {/* ปุ่มบันทึก */}
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
