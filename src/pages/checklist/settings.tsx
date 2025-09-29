// src/pages/checklist/settings.tsx
import { useState, useEffect } from "react";
import { useUserProfile } from "@/contexts/UserProfileContext";
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

// ✅ พยายามดึง object key จาก public URL (กรณีไม่มี company_logo_key ใน profile)
function deriveKeyFromPublicUrl(url?: string | null): string | null {
  if (!url) return null;
  const BUCKET = "public-assets";
  // ปกติ: https://<proj>.supabase.co/storage/v1/object/public/public-assets/<KEY>
  const marker = `/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
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

  // ✅ สองจังหวะ: ถ้ามี row → update, ถ้าไม่มี → insert
  const handleSave = async () => {
    setUpdating(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;
      if (!uid) {
        alert("ยังไม่ล็อกอิน");
        return;
      }

      const payload = {
        company_name: companyName || null,
        company_logo_url: companyLogoUrl || null,
        updated_at: new Date().toISOString(),
      };

      const { data: existing, error: selErr } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", uid)
        .maybeSingle(); // ← ถ้าไม่มีแถว data = null

      if (selErr) {
        console.error("อ่านโปรไฟล์ไม่ได้:", selErr);
        alert("อ่านโปรไฟล์ไม่สำเร็จ");
        return;
      }

      let error;
      if (existing?.id) {
        ({ error } = await supabase.from("profiles").update(payload).eq("id", uid));
      } else {
        ({ error } = await supabase.from("profiles").insert({ id: uid, ...payload }));
      }

      if (error) {
        console.error("บันทึกโปรไฟล์ไม่สำเร็จ:", error);
        alert("บันทึกไม่สำเร็จ: " + error.message);
        return;
      }

      await refresh();
      alert("บันทึกสำเร็จ");
    } finally {
      setUpdating(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    setUploading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;
      if (!uid) {
        alert("ยังไม่ล็อกอิน");
        return;
      }

      // ตรวจไฟล์
      if (!file.type.startsWith("image/")) {
        alert("อนุญาตเฉพาะไฟล์ภาพเท่านั้น");
        return;
      }
      const maxSizeMB = 5;
      if (file.size > maxSizeMB * 1024 * 1024) {
        alert(`ไฟล์ใหญ่เกินไป (จำกัด ${maxSizeMB}MB)`);
        return;
      }

      // อัปโหลดขึ้น Storage
      const key = `${uid}/logo/${Date.now()}-${slugify(file.name)}`;
      const { error: upErr } = await supabase.storage
        .from("public-assets")
        .upload(key, file, { upsert: true, contentType: file.type });
      if (upErr) {
        alert("อัปโหลดไม่สำเร็จ: " + upErr.message);
        return;
      }

      // ได้ URL สาธารณะ
      const { data: pub } = supabase.storage.from("public-assets").getPublicUrl(key);
      const url = pub?.publicUrl || "";

      // อ่าน row เดิม (ถ้ามี)
      const { data: existing, error: selErr } = await supabase
        .from("profiles")
        .select("id, company_logo_key, company_logo_url")
        .eq("id", uid)
        .maybeSingle();
      if (selErr) {
        console.error("อ่านโปรไฟล์ไม่ได้:", selErr);
        alert("อ่านโปรไฟล์ไม่สำเร็จ");
        return;
      }

      // บันทึกลง DB (update/insert)
      let error;
      if (existing?.id) {
        ({ error } = await supabase
          .from("profiles")
          .update({
            company_logo_url: url,
            company_logo_key: key, // ถ้าตารางมีคอลัมน์นี้จะเก็บ key ให้ด้วย
            updated_at: new Date().toISOString(),
          })
          .eq("id", uid));
      } else {
        ({ error } = await supabase
          .from("profiles")
          .insert({
            id: uid,
            company_logo_url: url,
            company_logo_key: key,
            updated_at: new Date().toISOString(),
          }));
      }
      if (error) {
        alert("บันทึกโลโก้ไม่สำเร็จ: " + error.message);
        return;
      }

      // ลบไฟล์เก่า (ถ้ามี) — ✅ ไม่แตะ profile.company_logo_key อีก
      const oldKey =
        existing?.company_logo_key ||
        deriveKeyFromPublicUrl(existing?.company_logo_url) ||
        deriveKeyFromPublicUrl(profile?.company_logo_url) ||
        "";
      if (oldKey && oldKey !== key) {
        const { error: sErr } = await supabase.storage.from("public-assets").remove([oldKey]);
        if (sErr) console.warn("ลบไฟล์เก่าไม่ได้:", sErr);
      }

      setCompanyLogoUrl(url);
      await refresh();
      alert("อัปโหลดโลโก้สำเร็จ");
    } finally {
      setUploading(false);
    }
  };

  const handleLogoDelete = async () => {
    setUploading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;
      if (!uid) {
        alert("ยังไม่ล็อกอิน");
        return;
      }

      const { data: existing, error: selErr } = await supabase
        .from("profiles")
        .select("id, company_logo_key")
        .eq("id", uid)
        .maybeSingle();
      if (selErr) {
        console.error("อ่านโปรไฟล์ไม่ได้:", selErr);
        alert("อ่านโปรไฟล์ไม่สำเร็จ");
        return;
      }
      if (!existing?.id) {
        // ยังไม่มี row → แค่ล้าง state UI
        setCompanyLogoUrl("");
        await refresh();
        return;
      }

      // ล้างค่าใน DB
      const { error: updErr } = await supabase
        .from("profiles")
        .update({
          company_logo_url: null,
          company_logo_key: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", uid);
      if (updErr) {
        alert("อัปเดตโปรไฟล์ไม่สำเร็จ: " + updErr.message);
        return;
      }

      // ลบไฟล์ใน Storage ถ้ามี
      if (existing.company_logo_key) {
        const { error: sErr } = await supabase.storage
          .from("public-assets")
          .remove([existing.company_logo_key]);
        if (sErr) console.warn("ลบไฟล์เก่าไม่ได้:", sErr);
      }

      setCompanyLogoUrl("");
      await refresh();
      alert("ลบโลโก้สำเร็จ");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="p-10 text-gray-600">กำลังโหลดข้อมูล...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">
        <span className="text-blue-800">⚙️</span> ตั้งค่าระบบ
      </h1>

      <div className="space-y-6">
        {/* ชื่อบริษัท */}
        <div>
          <label className="block font-semibold text-sm mb-1 text-gray-700">ชื่อบริษัท</label>
          <input
            type="text"
            className="w-full border border-gray-300 px-4 py-2 rounded focus:ring-blue-500 focus:border-blue-500"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="เช่น เจ้าของกิจการ จำกัด"
          />
        </div>

        {/* โลโก้บริษัท (อัปโหลด & URL ทางเลือก) */}
        <div className="space-y-3">
          <label className="block font-semibold text-sm text-gray-700">โลโก้บริษัท</label>

          {/* ปุ่มอัปโหลด */}
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded bg-blue-700 text-white hover:bg-blue-800 cursor-pointer disabled:opacity-50">
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
                // ปรับปุ่มลบให้เป็นโทนเทาเพื่อความเป็นทางการ แต่ยังคงสีแดงอ่อนไว้ด้านใน
                className="px-3 py-2 rounded bg-gray-100 text-red-600 border border-gray-300 hover:bg-red-50"
                title="ลบโลโก้"
              >
                🗑️ ลบโลโก้
              </button>
            )}
          </div>

          {/* ป้อน URL เอง (ทางเลือก) */}
          <div>
            <label className="block font-semibold text-xs text-gray-600 mb-1">
              หรือใส่ URL (เฉพาะผู้เชี่ยวชาญ)
            </label>
            <input
              type="url"
              className="w-full border border-gray-300 px-4 py-2 rounded focus:ring-blue-500 focus:border-blue-500"
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
                className="rounded border border-gray-300 shadow-sm"
              />
            </div>
          )}
        </div>

        {/* ปุ่มบันทึก */}
        <div>
          <button
            onClick={handleSave}
            disabled={updating}
            // เปลี่ยนเป็นสีน้ำเงินเข้ม (Blue-700) และ Hover เป็นสีเข้มขึ้น (Blue-800)
            className="bg-blue-700 text-white px-6 py-2 rounded shadow-md hover:bg-blue-800 disabled:opacity-50 transition-colors"
          >
            {updating ? "กำลังบันทึก..." : "💾 บันทึกการเปลี่ยนแปลง"}
          </button>
        </div>
      </div>
    </div>
  );
}