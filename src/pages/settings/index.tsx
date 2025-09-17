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
    <div className="p-6 space-y-6">
      {/* Tabs */}
      <div className="flex gap-2">
        <button
          className={`px-3 py-2 rounded-lg border ${tab === "personal" ? "bg-blue-600 text-white border-blue-600" : "bg-white"}`}
          onClick={() => setTab("personal")}
        >
          <div className="flex items-center gap-2">
            <User2 size={16} /> Personal
          </div>
        </button>
        <button
          className={`px-3 py-2 rounded-lg border ${tab === "company" ? "bg-blue-600 text-white border-blue-600" : "bg-white"}`}
          onClick={() => setTab("company")}
        >
          <div className="flex items-center gap-2">
            <Building2 size={16} /> Company
          </div>
        </button>
        <button
          className={`px-3 py-2 rounded-lg border ${tab === "system" ? "bg-blue-600 text-white border-blue-600" : "bg-white"}`}
          onClick={() => setTab("system")}
        >
          <div className="flex items-center gap-2">
            <Cog size={16} /> System
          </div>
        </button>
        <button
          className={`px-3 py-2 rounded-lg border ${tab === "integrations" ? "bg-blue-600 text-white border-blue-600" : "bg-white"}`}
          onClick={() => setTab("integrations")}
        >
          <div className="flex items-center gap-2">
            <LinkIcon size={16} /> Integrations
          </div>
        </button>
      </div>

      {/* Personal */}
      {tab === "personal" && (
        <div className="rounded-xl border bg-white p-5 space-y-4">
          <h2 className="font-semibold mb-2">ข้อมูลส่วนตัว (Personal)</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อ-นามสกุล</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border px-3 py-2"
                placeholder="เช่น คุณสมชาย ใจดี"
              />
            </div>

            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">รูปโปรไฟล์</label>
              <div className="flex items-center gap-3">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="avatar" className="h-16 w-16 rounded-full object-cover" />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center text-slate-400">IMG</div>
                )}
                <label className="inline-flex items-center gap-2 text-blue-600 cursor-pointer">
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
                    className="inline-flex items-center gap-2 text-rose-600"
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
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white px-4 py-2 disabled:opacity-60"
            >
              <Save size={18} />
              {savingPersonal ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </div>
      )}

      {/* Company */}
      {tab === "company" && (
        <div className="rounded-xl border bg-white p-5 space-y-4">
          <h2 className="font-semibold mb-2">ข้อมูลบริษัท (Company)</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อบริษัท</label>
              <input
                type="text"
                className="w-full rounded-lg border px-3 py-2"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="เช่น Justacost Co., Ltd."
              />
            </div>

            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">โลโก้บริษัท</label>
              <div className="flex items-center gap-3">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="logo" className="h-16 w-16 rounded bg-gray-100 object-contain" />
                ) : (
                  <div className="h-16 w-16 rounded bg-gray-100 flex items-center justify-center text-slate-400">LOGO</div>
                )}
                <label className="inline-flex items-center gap-2 text-blue-600 cursor-pointer">
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
                    className="inline-flex items-center gap-2 text-rose-600"
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
              <label className="block text-sm font-medium text-slate-700 mb-1">เลขทะเบียนนิติบุคคล (13 หลัก)</label>
              <input
                type="text"
                inputMode="numeric"
                value={juristicMasked}
                onChange={(e) => setJuristicRaw(e.target.value.replace(/\D+/g, "").slice(0, 13))}
                className={`w-full rounded-lg border px-3 py-2 ${juristicRaw && !isJuristic13(juristicRaw) ? "border-rose-400" : ""}`}
                placeholder="X-XXXX-XXXXX-XX"
              />
              <div className="text-xs text-slate-500 mt-1">* ไม่บังคับกรอก (ถ้ากรอกครบ 13 หลัก จะใช้เชื่อม benchmark ภายนอกภายหลัง)</div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">อุตสาหกรรม (TSIC/DBD – Section A–U)</label>
              <select className="w-full rounded-lg border px-3 py-2" value={industry} onChange={(e) => setIndustry(e.target.value)}>
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
            <div className="text-sm font-medium text-slate-700 mb-2">ช่วงยอดขายต่อปี (Revenue Band)</div>
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
                    className="hidden"
                    name="rev"
                    value={opt.value}
                    checked={revenueBand === opt.value}
                    onChange={() => setRevenueBand(opt.value)}
                  />
                  <div className="font-medium">{opt.label}</div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={saveCompany}
              disabled={savingCompany}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white px-4 py-2 disabled:opacity-60"
            >
              <Save size={18} />
              {savingCompany ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </div>
      )}

      {/* System */}
      {tab === "system" && (
        <div className="rounded-xl border bg-white p-5 space-y-4">
          <h2 className="font-semibold mb-2">การตั้งค่าระบบ (System)</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ภาษา (MVP: บันทึกในเบราว์เซอร์)</label>
              <select className="w-full rounded-lg border px-3 py-2" value={lang} onChange={(e) => setLang(e.target.value)}>
                <option value="th">ไทย</option>
                <option value="en">English</option>
              </select>
              <div className="text-xs text-slate-500 mt-1">* MVP ยังไม่เก็บใน DB เพื่อหลีกเลี่ยง schema change</div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={saveSystem}
              disabled={savingSystem}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white px-4 py-2 disabled:opacity-60"
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
        <div className={`fixed bottom-6 right-6 z-50 text-white px-4 py-2 rounded-lg shadow-lg ${toast.type === "success" ? "bg-emerald-600" : "bg-rose-600"}`}>
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

  const orgId =
    (profile as any)?.org_id ||
    (profile as any)?.company_id ||
    (profile as any)?.id ||
    orgOverride ||
    "";

  type SourceView = {
    id: string;
    code: string;
    name: string;
    kind: string;
    active: boolean;
    created_at: string;
    last_sync?: { status: string; started_at: string; finished_at?: string; message?: string } | null;
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
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const hasBitrix = useMemo(() => sources.some((s) => s.kind === "bitrix"), [sources]);

  // API helper
  async function api(path: string, init?: RequestInit & { query?: Record<string, string> }) {
    const href = path.startsWith("http") ? path : path.startsWith("/") ? path : `/${path}`;
    const url = new URL(href, window.location.origin);
    if (init?.query) Object.entries(init.query).forEach(([k, v]) => url.searchParams.set(k, String(v)));
    const res = await fetch(url.toString(), {
      method: init?.method || "GET",
      headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
      body: init?.body,
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      const e: any = new Error(j?.error || `HTTP ${res.status}`);
      e.status = res.status;
      throw e;
    }
    return res.json();
  }

  // Load list
  async function load() {
    if (!orgId) return;
    setLoading(true);
    setErr(null);
    try {
      const j = await api("/api/sources", { query: { orgId } });
      setSources(j.sources || []);
    } catch (e: any) {
      setErr(e?.message || "โหลดล้มเหลว");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  // Save Bitrix (POST → fallback GET upsert on 405)
  async function saveBitrix() {
    if (!orgId) {
      alert("ระบบยังไม่รู้จัก Org ของคุณ (เปิด Advanced เพื่อระบุชั่วคราวได้)");
      return;
    }
    try {
      setBxSaving(true);
      try {
        await api("/api/sources", {
          method: "POST",
          body: JSON.stringify({
            orgId,
            code: "bitrix_main",
            name: "Bitrix24 (Deals)",
            kind: "bitrix",
            credentials: {
              mode: "webhook",
              baseUrl: bxBaseUrl.trim(),
              userId: bxUserId.trim(),
              webhook: bxWebhook.trim(),
            },
            active: true,
          }),
        });
      } catch (err: any) {
        if (err?.status === 405) {
          const webhookUrl = `${bxBaseUrl.trim().replace(/\/+$/, "")}/rest/${encodeURIComponent(bxUserId.trim())}/${encodeURIComponent(bxWebhook.trim())}/`;
          await api("/api/sources/upsert", {
            method: "GET",
            query: {
              orgId,
              code: "bitrix_main",
              name: "Bitrix24 (Deals)",
              kind: "bitrix",
              "credentials.webhookUrl": webhookUrl,
              active: "true",
            },
          });
        } else {
          throw err;
        }
      }
      setBxBaseUrl("");
      setBxUserId("");
      setBxWebhook("");
      await load();
    } catch (e: any) {
      alert("บันทึกไม่สำเร็จ: " + (e?.message || "unknown"));
    } finally {
      setBxSaving(false);
    }
  }

  async function testSource(id: string) {
    if (!orgId) {
      alert("ยังไม่พบ Org ID");
      return;
    }
    try {
      setTestingId(id);
      const j = await api("/api/sources/test", { method: "POST", body: JSON.stringify({ orgId, sourceId: id }) });
      alert(`ทดสอบสำเร็จ (${j.kind}) • sample=${j.sample ?? "ok"}`);
    } catch (e: any) {
      alert("ทดสอบไม่สำเร็จ: " + (e?.message || "unknown)"));
    } finally {
      setTestingId(null);
    }
  }

  async function syncSource(id: string) {
    if (!orgId) {
      alert("ยังไม่พบ Org ID");
      return;
    }
    try {
      setSyncingId(id);
      const j = await api("/api/sources/sync", { method: "POST", body: JSON.stringify({ orgId, sourceId: id }) });
      alert(`ซิงก์สำเร็จ: ${j.kind} • ${j.from} → ${j.to}`);
      await load();
    } catch (e: any) {
      alert("ซิงก์ไม่สำเร็จ: " + (e?.message || "unknown)"));
    } finally {
      setSyncingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Advanced: Org override (dev only) */}
      {!( (profile as any)?.org_id || (profile as any)?.company_id || (profile as any)?.id ) && (
        <div className="rounded-xl border bg-white p-5">
          <button className="flex items-center gap-2 text-sm" onClick={() => setShowAdvanced((v) => !v)}>
            <ChevronDown size={16} className={`transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
            Advanced (Dev) — Org ID Override
          </button>
          {showAdvanced && (
            <div className="mt-3 flex gap-2">
              <input className="w-full rounded-lg border px-3 py-2" placeholder="ใส่ Org ID" value={orgOverride} onChange={(e) => setOrgOverride(e.target.value)} />
              <button
                className="px-3 py-2 rounded-lg border bg-white"
                onClick={() => {
                  if (typeof window !== "undefined") window.localStorage.setItem("ceopolar.orgId", orgOverride.trim());
                  alert("บันทึก Org ID ชั่วคราวแล้ว");
                }}
              >
                Save
              </button>
            </div>
          )}
          <div className="text-xs text-slate-500 mt-2">* ระบบจะใช้ค่านี้เมื่อยังดึง org จาก account ไม่ได้</div>
        </div>
      )}

      {/* Existing Sources */}
      <div className="rounded-xl border bg-white">
        <div className="p-5 flex items-center justify-between">
          <div className="font-semibold">Integrations · Data Sources</div>
          <button className="px-3 py-2 rounded-lg border bg-white inline-flex items-center gap-2" onClick={load} disabled={loading || !orgId}>
            <RefreshCcw size={16} /> โหลดใหม่
          </button>
        </div>
        {!orgId && <div className="px-5 pb-2 text-amber-600 text-sm">* ระบบยังไม่ทราบ Org — โปรดเข้าสู่ระบบ/เลือกบริษัท หรือใส่ใน Advanced</div>}
        {err && <div className="px-5 pb-2 text-rose-600">{err}</div>}

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {sources.map((s) => (
            <div key={s.id} className="rounded-lg border bg-white p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{s.name}</div>
                  <div className="text-xs text-slate-500">
                    {s.code} • {s.kind}
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full border ${
                    s.active ? "text-emerald-700 border-emerald-300 bg-emerald-50" : "text-rose-700 border-rose-300 bg-rose-50"
                  }`}
                >
                  {s.active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="text-xs text-slate-500">
                {s.last_sync ? (
                  <>
                    สถานะล่าสุด: <b>{s.last_sync.status}</b>
                    {s.last_sync.finished_at ? ` • ${new Date(s.last_sync.finished_at).toLocaleString()}` : ""}
                    {s.last_sync.message ? ` • ${s.last_sync.message}` : ""}
                  </>
                ) : (
                  "ยังไม่เคยซิงก์"
                )}
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 rounded-lg border bg-white inline-flex items-center gap-2 text-xs" onClick={() => testSource(s.id)} disabled={!!testingId || !orgId}>
                  <Radio size={14} /> {testingId === s.id ? "กำลังทดสอบ…" : "Test"}
                </button>
                <button className="px-3 py-1.5 rounded-lg bg-blue-600 text-white inline-flex items-center gap-2 text-xs" onClick={() => syncSource(s.id)} disabled={!!syncingId || !orgId}>
                  <LinkIcon size={14} /> {syncingId === s.id ? "กำลังซิงก์…" : "Sync now"}
                </button>
              </div>
            </div>
          ))}
          {!sources.length && <div className="p-4 text-sm text-slate-500">ยังไม่มีแหล่งข้อมูล กรอกแบบฟอร์มด้านล่างเพื่อเชื่อมแหล่งข้อมูลแรกของคุณ</div>}
        </div>
      </div>

      {/* Add Source: Bitrix */}
      <div className="rounded-xl border bg-white">
        <div className="p-5">
          <div className="font-semibold mb-3">เชื่อม Bitrix24 (Deals → SalesDaily)</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input className="w-full rounded-lg border px-3 py-2" placeholder="Base URL (เช่น https://YOUR.bitrix24.com)" value={bxBaseUrl} onChange={(e) => setBxBaseUrl(e.target.value)} />
            <input className="w-full rounded-lg border px-3 py-2" placeholder="User ID (ตัวเลขหลัง /rest/ เช่น 1)" value={bxUserId} onChange={(e) => setBxUserId(e.target.value)} />
            <input className="w-full rounded-lg border px-3 py-2" placeholder="Webhook token" value={bxWebhook} onChange={(e) => setBxWebhook(e.target.value)} />
          </div>
          <div className="mt-3">
            <button className="px-3 py-2 rounded-lg bg-blue-600 text-white inline-flex items-center gap-2" onClick={saveBitrix} disabled={!bxBaseUrl || !bxUserId || !bxWebhook || bxSaving || !orgId}>
              <CheckCircle2 size={16} /> {bxSaving ? "กำลังบันทึก…" : "บันทึก & เปิดใช้งาน"}
            </button>
          </div>
          {hasBitrix && <div className="text-xs text-slate-500 mt-2">* มี Bitrix source แล้ว 1 รายการ</div>}
        </div>
      </div>

      {/* CSV Uploaders */}
      <div className="rounded-xl border bg-white">
        <div className="p-5">
          <div className="font-semibold mb-3">อัปโหลด CSV (Manual)</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <CsvUploader title="Sales (รายวัน)" endpoint="/api/import/sales-csv" orgId={orgId} sample="date,channel,net_amount,gross_amount,orders" />
            <CsvUploader title="AR Aging" endpoint="/api/import/ar-aging-csv" orgId={orgId} sample="as_of_date,bucket,amount" />
            <CsvUploader title="NPS" endpoint="/api/import/nps-csv" orgId={orgId} sample="date,respondent_id,score,comment" />
          </div>
          <div className="text-xs text-slate-500 mt-3 flex items-center gap-2">
            <AlertTriangle size={14} className="text-amber-500" />
            ไฟล์ต้องเป็น UTF-8 / มี header คอลัมน์ตามตัวอย่าง
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================ CSV Uploader sub-component ================ */
function CsvUploader({ title, endpoint, orgId, sample }: { title: string; endpoint: string; orgId: string; sample: string }) {
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
    <div className="rounded-lg border bg-white p-3">
      <div className="font-semibold">{title}</div>
      <div className="text-xs text-slate-500 mb-2">
        ตัวอย่าง header: <code>{sample}</code>
      </div>
      <div className="flex items-center gap-2">
        <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full rounded-lg border px-3 py-2" />
        <button className="px-3 py-2 rounded-lg border bg-white inline-flex items-center gap-2" onClick={upload} disabled={!file || busy || !orgId}>
          <Upload size={14} /> {busy ? "กำลังอัปโหลด…" : "อัปโหลด"}
        </button>
      </div>
    </div>
  );
}
