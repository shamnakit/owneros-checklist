// src/pages/settings/index.tsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { useUserProfile } from "@/contexts/UserProfileContext";
import {
  User2,
  Building2,
  Cog,
  Save,
  Upload,
  Trash2,
  Link as LinkIcon,
  RefreshCcw,
  Radio,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  FileText,
  Plug,
} from "lucide-react";

/* ================= System settings (client only - MVP) ================= */
const SYS_LANG_KEY = "owneros_lang";

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

const sanitizeFileName = (name: string) =>
  name.replace(/[^\wก-๙. -]+/g, "_").replace(/\s+/g, "-");
const isJuristic13 = (s: string) => /^\d{13}$/.test(s);
const maskJuristic = (raw: string) => {
  const d = raw.replace(/\D+/g, "").slice(0, 13);
  const a = d.slice(0, 1);
  const b = d.slice(1, 5);
  const c = d.slice(5, 10);
  const e = d.slice(10, 12);
  return [a, b && `-${b}`, c && `-${c}`, e && `-${e}`].join("");
};

/* ================= Settings Page ================= */
export default function SettingsPage() {
  const { uid, profile, refresh } = useUserProfile();

  // tabs: personal / company / system / integrations
  const [tab, setTab] = useState<"personal" | "company" | "system" | "integrations">("company");

  // ---- Personal ----
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarKey, setAvatarKey] = useState<string | null>(null);
  const [savingPersonal, setSavingPersonal] = useState(false);

  // ---- Company ----
  const [companyName, setCompanyName] = useState("");
  const [revenueBand, setRevenueBand] = useState<string>("");
  const [industry, setIndustry] = useState<string>("");
  const [juristicRaw, setJuristicRaw] = useState("");
  const juristicMasked = useMemo(() => maskJuristic(juristicRaw), [juristicRaw]);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoKey, setLogoKey] = useState<string | null>(null);
  const [savingCompany, setSavingCompany] = useState(false);

  // ---- System ---- (client only MVP)
  const [lang, setLang] = useState<string>("th");
  const [savingSystem, setSavingSystem] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 2000);
  };

  // initial
  useEffect(() => {
    if (!profile) return;
    // personal
    setFullName(profile.full_name ?? "");
    setAvatarUrl(profile.avatar_url ?? null);
    // company
    setCompanyName(profile.company_name ?? "");
    setRevenueBand(profile.revenue_band ?? "");
    setIndustry(profile.industry_section ?? "");
    setJuristicRaw((profile.juristic_id ?? "").replace(/\D+/g, ""));
    setLogoUrl(profile.company_logo_url ?? null);
    setLogoKey(profile.company_logo_key ?? null);
    // system
    try {
      setLang(localStorage.getItem(SYS_LANG_KEY) || "th");
    } catch {}
  }, [profile]);

  // ---------- Upload helpers ----------
  const uploadToBucket = async (bucket: string, keyPrefix: string, file: File, oldKey?: string | null) => {
    if (!uid) throw new Error("no uid");
    const ts = Date.now();
    const key = `${keyPrefix}/${uid}/${ts}-${sanitizeFileName(file.name)}`;
    const { error: upErr } = await supabase.storage.from(bucket).upload(key, file, {
      upsert: true,
      contentType: file.type,
    });
    if (upErr) throw upErr;
    if (oldKey) {
      try {
        await supabase.storage.from(bucket).remove([oldKey]);
      } catch {}
    }
    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(key);
    return { key, url: pub?.publicUrl || "" };
  };

  // ---------- Save actions ----------
  const savePersonal = async () => {
    if (!uid) return;
    try {
      setSavingPersonal(true);
      const payload: Record<string, any> = {
        full_name: fullName?.trim() || null,
        avatar_url: avatarUrl || null,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from("profiles").update(payload).eq("id", uid);
      if (error) throw error;
      await refresh();
      showToast("บันทึก Personal สำเร็จ ✅");
    } catch (e) {
      console.error(e);
      showToast("บันทึก Personal ไม่สำเร็จ", "error");
    } finally {
      setSavingPersonal(false);
    }
  };

  const saveCompany = async () => {
    if (!uid) return;
    try {
      setSavingCompany(true);
      const payload: Record<string, any> = {
        company_name: companyName?.trim() || null,
        revenue_band: revenueBand || null,
        industry_section: industry || null,
        juristic_id: juristicRaw || null,
        company_logo_url: logoUrl || null,
        company_logo_key: logoKey || null,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from("profiles").update(payload).eq("id", uid);
      if (error) throw error;
      await refresh();
      showToast("บันทึก Company สำเร็จ ✅");
    } catch (e) {
      console.error(e);
      showToast("บันทึก Company ไม่สำเร็จ", "error");
    } finally {
      setSavingCompany(false);
    }
  };

  const saveSystem = async () => {
    try {
      setSavingSystem(true);
      localStorage.setItem(SYS_LANG_KEY, lang);
      showToast("บันทึก System สำเร็จ ✅");
    } catch (e) {
      console.error(e);
      showToast("บันทึก System ไม่สำเร็จ", "error");
    } finally {
      setSavingSystem(false);
    }
  };

  // ---------- Upload buttons ----------
  const onChangeAvatar = async (file: File) => {
    try {
      setUploading(true);
      const { key, url } = await uploadToBucket("avatars", "avatars", file, avatarKey);
      setAvatarKey(key);
      setAvatarUrl(url);
      showToast("อัปโหลดรูปโปรไฟล์แล้ว ✅");
    } catch (e) {
      console.error(e);
      showToast("อัปโหลดรูปโปรไฟล์ไม่สำเร็จ", "error");
    } finally {
      setUploading(false);
    }
  };

  const onChangeLogo = async (file: File) => {
    try {
      setUploading(true);
      const { key, url } = await uploadToBucket("company-logos", "company-logos", file, logoKey);
      setLogoKey(key);
      setLogoUrl(url);
      showToast("อัปโหลดโลโก้แล้ว ✅");
    } catch (e) {
      console.error(e);
      showToast("อัปโหลดโลโก้ไม่สำเร็จ", "error");
    } finally {
      setUploading(false);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="p-6 space-y-6 text-[var(--text-2)]">
      {/* Tabs */}
      <div className="flex gap-2">
        <button
          className={`px-3 py-2 rounded-lg border-[var(--border)] ${tab === "personal" ? "bg-[var(--accent)] text-white" : "bg-[var(--panel)]"}`}
          onClick={() => setTab("personal")}
        >
          <div className="flex items-center gap-2">
            <User2 size={16} /> Personal
          </div>
        </button>
        <button
          className={`px-3 py-2 rounded-lg border-[var(--border)] ${tab === "company" ? "bg-[var(--accent)] text-white" : "bg-[var(--panel)]"}`}
          onClick={() => setTab("company")}
        >
          <div className="flex items-center gap-2">
            <Building2 size={16} /> Company
          </div>
        </button>
        <button
          className={`px-3 py-2 rounded-lg border-[var(--border)] ${tab === "system" ? "bg-[var(--accent)] text-white" : "bg-[var(--panel)]"}`}
          onClick={() => setTab("system")}
        >
          <div className="flex items-center gap-2">
            <Cog size={16} /> System
          </div>
        </button>
        <button
          className={`px-3 py-2 rounded-lg border-[var(--border)] ${tab === "integrations" ? "bg-[var(--accent)] text-white" : "bg-[var(--panel)]"}`}
          onClick={() => setTab("integrations")}
        >
          <div className="flex items-center gap-2">
            <LinkIcon size={16} /> Integrations
          </div>
        </button>
      </div>

      {/* Personal */}
      {tab === "personal" && (
        <div className="rounded-xl border-[var(--border)] bg-[var(--panel)] p-5 space-y-4">
          <h2 className="font-semibold mb-2 text-[var(--text-1)]">ข้อมูลส่วนตัว (Personal)</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">ชื่อ-นามสกุล</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border-[var(--border)] bg-[var(--panel-2)] px-3 py-2 text-[var(--text-1)]"
                placeholder="เช่น คุณสมชาย ใจดี"
              />
            </div>

            <div className="md:col-span-1">
              <label className="block text-sm font-medium mb-1">รูปโปรไฟล์</label>
              <div className="flex items-center gap-3">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="avatar" className="h-16 w-16 rounded-full object-cover" />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-[var(--panel-2)] flex items-center justify-center text-[var(--muted)]">IMG</div>
                )}
                <label className="inline-flex items-center gap-2 text-[var(--accent)] cursor-pointer">
                  <Upload size={16} /> <span>{uploading ? "กำลังอัปโหลด…" : "อัปโหลด/เปลี่ยน"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) onChangeAvatar(f);
                      e.currentTarget.value = "";
                    }}
                  />
                </label>
                {avatarUrl && (
                  <button
                    className="inline-flex items-center gap-2 text-[var(--danger)]"
                    onClick={() => {
                      setAvatarUrl(null);
                      setAvatarKey(null);
                    }}
                  >
                    <Trash2 size={16} /> ลบรูป
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={savePersonal}
              disabled={savingPersonal}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] text-white px-4 py-2 disabled:opacity-60 hover:bg-[var(--accent-hover)]"
            >
              <Save size={18} />
              {savingPersonal ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </div>
      )}

      {/* Company */}
      {tab === "company" && (
        <div className="rounded-xl border-[var(--border)] bg-[var(--panel)] p-5 space-y-4">
          <h2 className="font-semibold mb-2 text-[var(--text-1)]">ข้อมูลบริษัท (Company)</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">ชื่อบริษัท</label>
              <input
                type="text"
                className="w-full rounded-lg border-[var(--border)] bg-[var(--panel-2)] px-3 py-2 text-[var(--text-1)]"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="เช่น Justacost Co., Ltd."
              />
            </div>

            <div className="md:col-span-1">
              <label className="block text-sm font-medium mb-1">โลโก้บริษัท</label>
              <div className="flex items-center gap-3">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="logo" className="h-16 w-16 rounded bg-[var(--panel-2)] object-contain" />
                ) : (
                  <div className="h-16 w-16 rounded bg-[var(--panel-2)] flex items-center justify-center text-[var(--muted)]">LOGO</div>
                )}
                <label className="inline-flex items-center gap-2 text-[var(--accent)] cursor-pointer">
                  <Upload size={16} />
                  <span>{uploading ? "กำลังอัปโหลด…" : "อัปโหลด/เปลี่ยน"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) onChangeLogo(f);
                      e.currentTarget.value = "";
                    }}
                  />
                </label>
                {logoUrl && (
                  <button
                    className="inline-flex items-center gap-2 text-[var(--danger)]"
                    onClick={() => {
                      setLogoUrl(null);
                      setLogoKey(null);
                    }}
                  >
                    <Trash2 size={16} /> ลบโลโก้
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">เลขทะเบียนนิติบุคคล (13 หลัก)</label>
              <input
                type="text"
                inputMode="numeric"
                value={juristicMasked}
                onChange={(e) => setJuristicRaw(e.target.value.replace(/\D+/g, "").slice(0, 13))}
                className={`w-full rounded-lg border-[var(--border)] bg-[var(--panel-2)] px-3 py-2 text-[var(--text-1)] ${juristicRaw && !isJuristic13(juristicRaw) ? "border-[var(--danger)]" : ""}`}
                placeholder="X-XXXX-XXXXX-XX"
              />
              <div className="text-xs text-[var(--muted)] mt-1">* ไม่บังคับกรอก (ถ้ากรอกครบ 13 หลัก จะใช้เชื่อม benchmark ภายนอกภายหลัง)</div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">อุตสาหกรรม (TSIC/DBD – Section A–U)</label>
              <select className="w-full rounded-lg border-[var(--border)] bg-[var(--panel-2)] px-3 py-2 text-[var(--text-1)]" value={industry} onChange={(e) => setIndustry(e.target.value)}>
                <option value="">— เลือกหมวดอุตสาหกรรม —</option>
                {MOC_INDUSTRY_SECTIONS.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="text-sm font-medium mb-2">ช่วงยอดขายต่อปี (Revenue Band)</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {REVENUE_BANDS.map((opt) => (
                <label
                  key={opt.value}
                  className={`border-[var(--border)] rounded-xl p-3 cursor-pointer transition ${
                    revenueBand === opt.value
                      ? "border-[var(--accent)] ring-2 ring-[var(--ring-soft)] bg-[var(--panel-elev)]"
                      : "hover:border-[var(--border)] bg-[var(--panel)]"
                  }`}
                >
                  <input
                    type="radio"
                    className="hidden"
                    name="rev"
                    value={opt.value}
                    checked={revenueBand === opt.value}
                    onChange={() => setRevenueBand(opt.value)}
                  />
                  <div className="font-medium text-[var(--text-1)]">{opt.label}</div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={saveCompany}
              disabled={savingCompany}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] text-white px-4 py-2 disabled:opacity-60 hover:bg-[var(--accent-hover)]"
            >
              <Save size={18} />
              {savingCompany ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </div>
      )}

      {/* System */}
      {tab === "system" && (
        <div className="rounded-xl border-[var(--border)] bg-[var(--panel)] p-5 space-y-4">
          <h2 className="font-semibold mb-2 text-[var(--text-1)]">การตั้งค่าระบบ (System)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">ภาษา (MVP: บันทึกในเบราว์เซอร์)</label>
              <select className="w-full rounded-lg border-[var(--border)] bg-[var(--panel-2)] px-3 py-2 text-[var(--text-1)]" value={lang} onChange={(e) => setLang(e.target.value)}>
                <option value="th">ไทย</option>
                <option value="en">English</option>
              </select>
              <div className="text-xs text-[var(--muted)] mt-1">* MVP ยังไม่เก็บใน DB เพื่อหลีกเลี่ยง schema change</div>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={saveSystem}
              disabled={savingSystem}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] text-white px-4 py-2 disabled:opacity-60 hover:bg-[var(--accent-hover)]"
            >
              <Save size={18} />
              {savingSystem ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </div>
      )}

      {/* Integrations */}
      {tab === "integrations" && <IntegrationsPanel />}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 text-white px-4 py-2 rounded-lg shadow-lg ${toast.type === "success" ? "bg-[var(--success)]" : "bg-[var(--danger)]"}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

/* ================= Integrations Panel (Data Sources) ================= */
function IntegrationsPanel() {
  const { profile } = useUserProfile();
  // org binding + dev override (advanced)
  const [orgOverride, setOrgOverride] = useState<string>("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("ceopolar.orgId") || "";
    if (saved) setOrgOverride(saved);
  }, []);

  const orgId = (profile as any)?.org_id || (profile as any)?.company_id || (profile as any)?.id || orgOverride || "";

  type SourceView = {
    id: string;
    code: string;
    name: string;
    kind: string;
    active: boolean;
    created_at: string;
    last_sync?: {
      status: string;
      started_at: string;
      finished_at?: string;
      message?: string;
    } | null;
  };
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState<SourceView[]>([]);
  const [err, setErr] = useState<string | null>(null);

  // Bitrix form
  const [bxBaseUrl, setBxBaseUrl] = useState("");
  const [bxUserId, setBxUserId] = useState("");
  const [bxWebhook, setBxWebhook] = useState("");
  const [bxSaving, setBxSaving] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSources();
  }, [orgId]);

  const fetchSources = async () => {
    if (!orgId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/integrations/list`, {
        headers: { "x-org-id": orgId },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setSources(json.sources || []);
      setErr(null);
    } catch (e) {
      console.error("fetch sources failed", e);
      setErr("ดึงข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const sync = async (sourceId: string) => {
    try {
      setTestingId(sourceId);
      const res = await fetch(`/api/integrations/sync/${sourceId}`, {
        method: "POST",
        headers: { "x-org-id": orgId },
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${res.status}`);
      }
      alert("เริ่มซิงค์ข้อมูลแล้ว");
    } catch (e: any) {
      console.error("sync failed", e);
      alert(`ไม่สามารถซิงค์ได้: ${e?.message || "unknown"}`);
    } finally {
      setTestingId(null);
      fetchSources();
    }
  };

  const saveBitrix = async () => {
    if (!bxBaseUrl || !bxUserId || !bxWebhook) {
      alert("กรอกข้อมูลให้ครบ");
      return;
    }
    setBxSaving(true);
    try {
      const payload = {
        kind: "bitrix24_webhook",
        config: {
          webhook_url: bxWebhook,
          user_id: bxUserId,
          base_url: bxBaseUrl,
        },
      };
      const res = await fetch(`/api/integrations/save`, {
        method: "POST",
        headers: { "x-org-id": orgId, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "unknown error");
      alert("บันทึก Bitrix24 แล้ว");
      fetchSources();
    } catch (e: any) {
      console.error("save bitrix failed", e);
      alert(`บันทึกไม่สำเร็จ: ${e?.message || "unknown"}`);
    } finally {
      setBxSaving(false);
    }
  };

  return (
    <div className="rounded-xl border-[var(--border)] bg-[var(--panel)] p-5 space-y-4 text-[var(--text-2)]">
      <h2 className="font-semibold text-[var(--text-1)]">แหล่งข้อมูล (Data Sources)</h2>
      <p>เชื่อมต่อกับแหล่งข้อมูลเพื่อดึงข้อมูลอัตโนมัติมาแสดงบน Dashboard ของท่าน</p>

      {/* Section 1: Manual Data Upload */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-[var(--text-1)] font-semibold text-lg">
          <FileText size={20} />
          อัปโหลดไฟล์ด้วยตนเอง (Manual Data Upload)
        </div>
        <p className="text-sm text-[var(--muted)]">
          เหมาะสำหรับข้อมูลที่ไม่ได้อัปเดตแบบ Real-time เช่น ข้อมูลยอดขายประจำไตรมาส
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
          <UploadCSV title="ยอดขาย (Sales)" endpoint="/api/upload/sales" orgId={orgId} sample="date,value,note" />
          <UploadCSV title="กระแสเงินสด (Cash Flow)" endpoint="/api/upload/cash" orgId={orgId} sample="date,type,amount,note" />
          <UploadCSV title="ค่าใช้จ่าย (Expenses)" endpoint="/api/upload/expenses" orgId={orgId} sample="date,type,amount,note" />
          {/* You can add more upload cards here */}
        </div>
      </div>
      
      {/* Horizontal Line for separation */}
      <hr className="my-6 border-[var(--border)]" />

      {/* Section 2: Automated Business Systems */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-[var(--text-1)] font-semibold text-lg">
          <Plug size={20} />
          เชื่อมต่อระบบธุรกิจอัตโนมัติ (Automated Business Systems)
        </div>
        <p className="text-sm text-[var(--muted)]">
          เชื่อมต่อกับแพลตฟอร์มยอดนิยมเพื่อดึงข้อมูลแบบ Real-time
        </p>

        {/* Category: Accounting & ERP */}
        <div>
          <h3 className="font-medium text-[var(--text-1)] mb-2">Accounting & ERP</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <IntegrationCard title="Odoo" description="ระบบ ERP & บัญชี" status="ยังไม่ได้เชื่อมต่อ" />
            <IntegrationCard title="Oracle NetSuite" description="ระบบ ERP & การเงิน" status="ยังไม่ได้เชื่อมต่อ" />
            <IntegrationCard title="Xero" description="ระบบบัญชีออนไลน์" status="ยังไม่ได้เชื่อมต่อ" />
            <IntegrationCard title="QuickBooks" description="ระบบบัญชีออนไลน์" status="ยังไม่ได้เชื่อมต่อ" />
          </div>
        </div>

        {/* Category: Sales & CRM */}
        <div>
          <h3 className="font-medium text-[var(--text-1)] mb-2">Sales & CRM</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <IntegrationCard
              title="Bitrix24"
              description="ระบบ CRM และการสื่อสาร"
              status="เชื่อมต่อแล้ว"
              showConnectForm={true}
              connectFormProps={{ bxWebhook, setBxWebhook, bxUserId, setBxUserId, bxBaseUrl, setBxBaseUrl, bxSaving, saveBitrix }}
            />
            <IntegrationCard title="Salesforce" description="ระบบ CRM ระดับโลก" status="ยังไม่ได้เชื่อมต่อ" />
            <IntegrationCard title="HubSpot" description="ระบบการตลาด & CRM" status="ยังไม่ได้เชื่อมต่อ" />
          </div>
        </div>
        {/* You can add more categories here */}
      </div>

      {/* Connected sources status */}
      <div className="rounded-xl border-[var(--border)] bg-[var(--panel)] p-5 space-y-4 text-[var(--text-2)]">
        <h2 className="font-semibold text-[var(--text-1)]">ข้อมูลที่เชื่อมต่อแล้ว</h2>
        <p className="text-xs text-[var(--muted)]">
          แสดงข้อมูลแหล่งที่มาที่ท่านได้เชื่อมต่อไว้แล้ว
        </p>
        <div className="bg-[var(--panel-2)] rounded-lg p-3 space-y-2">
          {loading && (
            <div className="text-center py-5 text-[var(--muted)]">กำลังดึงข้อมูล...</div>
          )}
          {!loading && err && (
            <div className="text-center py-5 text-[var(--danger)]">
              <div className="flex justify-center mb-2">
                <AlertTriangle size={24} />
              </div>
              {err}
            </div>
          )}
          {!loading && !err && sources.length === 0 && (
            <div className="text-center py-5 text-[var(--muted)]">
              ยังไม่มีแหล่งข้อมูลที่เชื่อมต่อ
            </div>
          )}
          {!loading &&
            !err &&
            sources.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-2 rounded-lg bg-[var(--panel-elev)]">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[var(--text-1)] truncate">{s.name}</div>
                  <div className="text-xs text-[var(--muted)] truncate">{s.kind}</div>
                </div>
                <div className="flex-shrink-0 flex items-center gap-2">
                  <span
                    className={`text-sm font-medium ${s.active ? "text-[var(--success)]" : "text-[var(--danger)]"}`}
                  >
                    <Radio size={14} className="inline-block mr-1" />
                    {s.active ? "เชื่อมต่อแล้ว" : "ไม่ได้ใช้งาน"}
                  </span>
                  <button
                    onClick={() => sync(s.id)}
                    className="flex items-center gap-1 rounded-full text-[var(--accent)] transition-transform hover:rotate-90 disabled:opacity-50"
                    disabled={testingId === s.id}
                  >
                    <RefreshCcw size={16} />
                  </button>
                  <button className="flex items-center gap-1 text-[var(--danger)] transition hover:text-rose-400">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function UploadCSV({ title, endpoint, orgId, sample }: { title: string; endpoint: string; orgId: string; sample: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function upload() {
    if (!file) return;
    setBusy(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "x-org-id": orgId },
        body: file,
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${res.status}`);
      }
      const j = await res.json();
      alert(`${title} อัปโหลดสำเร็จ: ${j.count} แถว`);
    } catch (e: any) {
      alert(`${title} ล้มเหลว: ${e?.message || "unknown"}`);
    } finally {
      setBusy(false);
      setFile(null);
    }
  }

  return (
    <div className="rounded-lg border-[var(--border)] bg-[var(--panel)] p-3 text-[var(--text-2)]">
      <div className="font-semibold text-[var(--text-1)]">{title}</div>
      <div className="text-xs text-[var(--muted)] mb-2">
        ตัวอย่าง header: <code className="text-[var(--accent)]">{sample}</code>
      </div>
      <div className="flex items-center gap-2">
        <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <button
          onClick={upload}
          disabled={!file || busy}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] text-white px-3 py-2 text-sm disabled:opacity-60 hover:bg-[var(--accent-hover)]"
        >
          <Upload size={16} />
          {busy ? "กำลังอัปโหลด..." : "อัปโหลด"}
        </button>
        {file && <div className="text-sm truncate">{file.name}</div>}
      </div>
    </div>
  );
}

interface IntegrationCardProps {
  title: string;
  description: string;
  status: 'เชื่อมต่อแล้ว' | 'ยังไม่ได้เชื่อมต่อ';
  showConnectForm?: boolean;
  connectFormProps?: any;
}

function IntegrationCard({ title, description, status, showConnectForm, connectFormProps }: IntegrationCardProps) {
  return (
    <div className="rounded-lg border-[var(--border)] bg-[var(--panel)] p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="font-semibold text-[var(--text-1)]">{title}</div>
          <div className="text-sm text-[var(--muted)]">{description}</div>
        </div>
        <div className={`text-xs font-medium px-2 py-1 rounded-full ${
            status === 'เชื่อมต่อแล้ว' ? 'bg-[var(--success)] text-white' : 'bg-gray-500 text-white'
        }`}>
          {status}
        </div>
      </div>
      {showConnectForm ? (
        <div className="space-y-2 text-sm">
          <div>
            <label className="block mb-1">Webhook URL</label>
            <input
              type="text"
              className="w-full rounded-lg bg-[var(--panel-2)] border-[var(--border)] px-3 py-2 text-[var(--text-1)]"
              value={connectFormProps.bxWebhook}
              onChange={(e) => connectFormProps.setBxWebhook(e.target.value)}
            />
          </div>
          <div>
            <label className="block mb-1">User ID</label>
            <input
              type="text"
              className="w-full rounded-lg bg-[var(--panel-2)] border-[var(--border)] px-3 py-2 text-[var(--text-1)]"
              value={connectFormProps.bxUserId}
              onChange={(e) => connectFormProps.setBxUserId(e.target.value)}
            />
          </div>
          <div>
            <label className="block mb-1">Base URL</label>
            <input
              type="text"
              className="w-full rounded-lg bg-[var(--panel-2)] border-[var(--border)] px-3 py-2 text-[var(--text-1)]"
              value={connectFormProps.bxBaseUrl}
              onChange={(e) => connectFormProps.setBxBaseUrl(e.target.value)}
            />
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={connectFormProps.saveBitrix}
              disabled={connectFormProps.bxSaving}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] text-white px-4 py-2 disabled:opacity-60 hover:bg-[var(--accent-hover)]"
            >
              <Save size={18} />
              {connectFormProps.bxSaving ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </div>
      ) : (
        <button
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] text-white px-4 py-2 disabled:opacity-60 hover:bg-[var(--accent-hover)]"
        >
          เชื่อมต่อ
        </button>
      )}
    </div>
  );
}