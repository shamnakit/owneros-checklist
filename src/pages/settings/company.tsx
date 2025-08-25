// src/pages/settings/company.tsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { Building2, Upload, Trash2, Save } from "lucide-react";

/** TSIC/DBD Sections A–U */
const MOC_INDUSTRY_SECTIONS: { code: string; label: string }[] = [
  { code: "A", label: "A – เกษตรกรรม ป่าไม้ และการประมง" },
  { code: "B", label: "B – การทำเหมืองแร่และเหมืองหิน" },
  { code: "C", label: "C – การผลิต (Manufacturing)" },
  { code: "D", label: "D – ไฟฟ้า ก๊าซ ไอน้ำ และระบบปรับอากาศ" },
  { code: "E", label: "E – การประปา ระบบจัดการของเสีย และบำบัดน้ำเสีย" },
  { code: "F", label: "F – ก่อสร้าง" },
  { code: "G", label: "G – ค้าส่ง ค้าปลีก และการซ่อมยานยนต์" },
  { code: "H", label: "H – คมนาคม คลังสินค้า และไปรษณีย์" },
  { code: "I", label: "I – ที่พักแรมและบริการด้านอาหาร" },
  { code: "J", label: "J – ข้อมูลข่าวสารและการสื่อสาร (ICT/Software)" },
  { code: "K", label: "K – การเงิน การประกันภัย และกิจกรรมทางการเงินอื่น" },
  { code: "L", label: "L – อสังหาริมทรัพย์" },
  { code: "M", label: "M – วิชาชีพ วิทยาศาสตร์ และเทคนิค" },
  { code: "N", label: "N – บริหารจัดการและสนับสนุนบริการ" },
  { code: "O", label: "O – ราชการ ป้องกันประเทศ และประกันสังคมภาคบังคับ" },
  { code: "P", label: "P – การศึกษา" },
  { code: "Q", label: "Q – สาธารณสุขและงานสังคมสงเคราะห์" },
  { code: "R", label: "R – ศิลปะ บันเทิง และนันทนาการ" },
  { code: "S", label: "S – กิจกรรมบริการด้านอื่น ๆ" },
  { code: "T", label: "T – กิจกรรมครัวเรือนเป็นนายจ้าง" },
  { code: "U", label: "U – องค์การระหว่างประเทศและนอกประเทศ" },
];

const REVENUE_BANDS = [
  { value: "<5M", label: "< 5 ล้านบาท/ปี" },
  { value: "5-10M", label: "5–10 ล้านบาท/ปี" },
  { value: "10-30M", label: "10–30 ล้านบาท/ปี" },
  { value: "30-50M", label: "30–50 ล้านบาท/ปี" },
  { value: "50-100M", label: "50–100 ล้านบาท/ปี" },
  { value: "100-300M", label: "100–300 ล้านบาท/ปี" },
  { value: "300-500M", label: "300–500 ล้านบาท/ปี" },
  { value: "500-1000M", label: "500–1,000 ล้านบาท/ปี" },
  { value: ">=1000M", label: "≥ 1,000 ล้านบาท/ปี" },
];

// --- Utils ---
const sanitizeFileName = (name: string) =>
  name.replace(/[^\wก-๙. -]+/g, "_").replace(/\s+/g, "-");

// 13 digits numeric only
const isJuristicDigits = (raw: string) => /^\d{13}$/.test(raw);

// mask: X-XXXX-XXXXX-XX
const formatJuristicMask = (raw: string) => {
  const d = raw.replace(/\D+/g, "").slice(0, 13);
  const a = d.slice(0, 1);
  const b = d.slice(1, 5);
  const c = d.slice(5, 10);
  const e = d.slice(10, 12);
  return [a, b && `-${b}`, c && `-${c}`, e && `-${e}`].join("");
};

export default function CompanySettingsPage() {
  const { uid, profile, refresh } = useUserProfile();

  const [companyName, setCompanyName] = useState("");
  const [juristicRaw, setJuristicRaw] = useState(""); // เก็บแบบไม่มีขีด
  const juristicMasked = useMemo(() => formatJuristicMask(juristicRaw), [juristicRaw]);
  const [industry, setIndustry] = useState("");
  const [revenueBand, setRevenueBand] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoKey, setLogoKey] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 2200);
  };

  
useEffect(() => {
  if (!profile) return;
  setCompanyName(profile.company_name ?? "");
  setRevenueBand(profile.revenue_band ?? "");
  setLogoUrl(profile.company_logo_url ?? null);
  setLogoKey(profile.company_logo_key ?? null);
  setIndustry(profile.industry_section ?? "");
  setJuristicRaw((profile.juristic_id ?? "").replace(/\D+/g, ""));
}, [profile]);


  const canSave = useMemo(() => {
    const okJuristic = !juristicRaw || isJuristicDigits(juristicRaw);
    return companyName.trim().length > 0 && industry && revenueBand && okJuristic;
  }, [companyName, industry, revenueBand, juristicRaw]);

  // --- Logo Upload/Remove ---
  const handleUploadLogo = async (file: File) => {
    if (!uid) return;
    if (file.size > 3 * 1024 * 1024) {
      showToast("ไฟล์ใหญ่เกิน 3MB", "error");
      return;
    }
    try {
      setUploading(true);
      const ts = Date.now();
      const key = `${uid}/${ts}-${sanitizeFileName(file.name)}`;
      const { error: upErr } = await supabase.storage
        .from("company-logos")
        .upload(key, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from("company-logos").getPublicUrl(key);
      const url = pub?.publicUrl || "";

      if (logoKey) await supabase.storage.from("company-logos").remove([logoKey]);

      setLogoKey(key);
      setLogoUrl(url);
      showToast("อัปโหลดโลโก้แล้ว ✅", "success");
    } catch (e) {
      console.error(e);
      showToast("อัปโหลดโลโก้ไม่สำเร็จ", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    try {
      if (logoKey) await supabase.storage.from("company-logos").remove([logoKey]);
      setLogoKey(null);
      setLogoUrl(null);
      showToast("ลบโลโก้แล้ว", "success");
    } catch (e) {
      console.error(e);
      showToast("ลบโลโก้ไม่สำเร็จ", "error");
    }
  };

  // --- Save ---
  const handleSave = async () => {
    if (!uid) return;
    if (juristicRaw && !isJuristicDigits(juristicRaw)) {
      showToast("เลขทะเบียนนิติบุคคลต้องเป็นตัวเลข 13 หลัก", "error");
      return;
    }
    try {
      setSaving(true);
      const payload: Record<string, any> = {
        company_name: companyName.trim(),
        revenue_band: revenueBand || null,
        company_logo_url: logoUrl,
        company_logo_key: logoKey,
        industry_section: industry || null,
        juristic_id: juristicRaw || null, // เก็บแบบไม่ใส่ขีด
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from("profiles").update(payload).eq("id", uid);
      if (error) {
        console.error("save error:", error);
        showToast("บันทึกไม่สำเร็จ", "error");
        return;
      }
      await refresh();
      showToast("บันทึกข้อมูลบริษัทเรียบร้อย ✅", "success");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Building2 className="text-slate-700" />
        <h1 className="text-2xl font-bold">Company Settings</h1>
      </div>

      {/* Basic */}
      <div className="rounded-xl border bg-white p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              ชื่อบริษัท / Company Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full rounded-lg border px-3 py-2"
              placeholder="เช่น Justacost Co., Ltd."
            />
          </div>

          {/* Logo */}
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">โลโก้บริษัท</label>
            <div className="flex items-center gap-3">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="logo" className="h-16 w-16 rounded bg-gray-100 object-contain" />
              ) : (
                <div className="h-16 w-16 rounded bg-gray-100 flex items-center justify-center text-slate-400">
                  LOGO
                </div>
              )}
              <div className="flex flex-col gap-2">
                <label className="inline-flex items-center gap-2 text-blue-600 cursor-pointer">
                  <Upload size={16} />
                  <span>{uploading ? "กำลังอัปโหลด…" : "อัปโหลด/เปลี่ยนโลโก้"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUploadLogo(f);
                      e.currentTarget.value = "";
                    }}
                  />
                </label>
                {logoUrl && (
                  <button type="button" onClick={handleRemoveLogo} className="inline-flex items-center gap-2 text-rose-600">
                    <Trash2 size={16} />
                    ลบโลโก้
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Juristic + Industry */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              เลขทะเบียนนิติบุคคล (13 หลัก)
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={juristicMasked}
              onChange={(e) => setJuristicRaw(e.target.value.replace(/\D+/g, "").slice(0, 13))}
              className={`w-full rounded-lg border px-3 py-2 ${
                juristicRaw && !isJuristicDigits(juristicRaw) ? "border-rose-400" : ""
              }`}
              placeholder="X-XXXX-XXXXX-XX"
            />
            {juristicRaw && !isJuristicDigits(juristicRaw) && (
              <div className="text-xs text-rose-600 mt-1">กรุณากรอกเป็นตัวเลข 13 หลัก</div>
            )}
            <div className="text-xs text-slate-500 mt-1">
              * ค่า MVP: ตรวจยาว 13 หลัก (ตัวเลข) — ถ้าต้องการ checksum จริง บอกได้ เดี๋ยวใส่ให้เพิ่ม
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              อุตสาหกรรม (TSIC/DBD – Section A–U) <span className="text-rose-500">*</span>
            </label>
            <select
              className="w-full rounded-lg border px-3 py-2"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            >
              <option value="">— เลือกหมวดอุตสาหกรรม —</option>
              {MOC_INDUSTRY_SECTIONS.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.label}
                </option>
              ))}
            </select>
            <div className="text-xs text-slate-500 mt-1">ใช้สำหรับจัดกลุ่ม Benchmark</div>
          </div>
        </div>
      </div>

      {/* Revenue Band */}
      <div className="rounded-xl border bg-white p-5">
        <div className="mb-3">
          <div className="text-sm font-medium text-slate-700">
            ช่วงยอดขายต่อปี (Revenue Band) <span className="text-rose-500">*</span>
          </div>
          <div className="text-xs text-slate-500">ใช้เพื่อเทียบกับบริษัทขนาดใกล้เคียง</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {REVENUE_BANDS.map((opt) => (
            <label
              key={opt.value}
              className={`border rounded-xl p-3 cursor-pointer transition ${
                revenueBand === opt.value ? "border-blue-600 ring-2 ring-blue-200 bg-blue-50" : "hover:border-slate-400 bg-white"
              }`}
            >
              <input
                type="radio"
                name="revenue_band"
                value={opt.value}
                className="hidden"
                checked={revenueBand === opt.value}
                onChange={() => setRevenueBand(opt.value)}
              />
              <div className="font-medium">{opt.label}</div>
            </label>
          ))}
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          type="button"
          disabled={!canSave || saving}
          onClick={handleSave}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white px-4 py-2 disabled:opacity-60"
        >
          <Save size={18} />
          {saving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
        </button>
      </div>

      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 text-white px-4 py-2 rounded-lg shadow-lg ${
            toast.type === "success" ? "bg-emerald-600" : "bg-rose-600"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
