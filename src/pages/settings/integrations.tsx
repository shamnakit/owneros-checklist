// src/pages/settings/integrations.tsx
import React, { useEffect, useMemo, useState } from "react";

const SHELL = "min-h-screen bg-[#0b172b] text-white";
const WRAP = "max-w-3xl mx-auto px-6 py-10";
const CARD = "rounded-2xl bg-[#0f2547] p-5 md:p-6 shadow-lg border border-white/5";
const LABEL = "block text-sm text-white/70 mb-2";
const INPUT = "w-full rounded-xl bg-white/10 text-white placeholder-white/40 px-4 py-3 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-cyan-400 transition";
const BTN_PRI = "px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed";
const BTN_SEC = "px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-40";

function getOrgId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("ceopolar.orgId");
}

const isUuid = (s?: string | null) =>
  !!s && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);

export default function IntegrationsPage() {
  const [orgId, setOrgId] = useState<string | null>(null);
  const [webhook, setWebhook] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [testResult, setTestResult] = useState<{ name?: string; email?: string } | null>(null);

  useEffect(() => {
    setOrgId(getOrgId());
  }, []);

  const validWebhook = useMemo(
    () => /^https:\/\/.+bitrix24\..+\/rest\/\d+\/[A-Za-z0-9]+\/$/.test(webhook),
    [webhook]
  );
  const validOrg = useMemo(() => isUuid(orgId), [orgId]);
  const canSubmit = validWebhook && validOrg;

  async function onSave() {
    setMsg(null);
    setTestResult(null);
    if (!validOrg) return setMsg({ type: "err", text: "orgId ต้องเป็น UUID และต้องผูกบริษัทก่อน" });
    if (!validWebhook) return setMsg({ type: "err", text: "กรุณากรอก Webhook URL แบบเต็ม และลงท้ายด้วย '/'" });

    setSaving(true);
    try {
      const host = new URL(webhook).hostname;
      const r = await fetch(`/api/integrations/save?orgId=${encodeURIComponent(orgId!)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // 🔧 เปลี่ยนจาก config → credentials ให้ตรง backend ใหม่
        body: JSON.stringify({
          kind: "bitrix24_webhook",
          credentials: { webhook_url: webhook },
          name: `Bitrix24 (${host})`,
          code: "bitrix24",
        }),
      });
      const json = await r.json();
      if (!r.ok || !json?.success) throw new Error(json?.error || `Save failed ${r.status}`);
      setMsg({ type: "ok", text: "บันทึกสำเร็จ" });
    } catch (e: any) {
      setMsg({ type: "err", text: e?.message || "บันทึกล้มเหลว" });
    } finally {
      setSaving(false);
    }
  }

  async function onTest() {
    setMsg(null);
    setTestResult(null);
    if (!validOrg) return setMsg({ type: "err", text: "ยังไม่พบหรือ orgId ไม่ใช่ UUID" });
    if (!validWebhook) return setMsg({ type: "err", text: "Webhook URL ไม่ถูกต้อง" });

    setTesting(true);
    try {
      const r = await fetch(`/api/integrations/test?orgId=${encodeURIComponent(orgId!)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhook_url: webhook }),
      });
      const json = await r.json();
      if (!json?.ok) {
        return setMsg({
          type: "err",
          text: `ทดสอบไม่ผ่าน (${json?.status || "?"}) - ${json?.reason || json?.error || "Unknown"}`
        });
      }
      setTestResult({ name: json?.result?.name, email: json?.result?.email });
      setMsg({ type: "ok", text: "ทดสอบสำเร็จ: ติดต่อ Bitrix ได้" });
    } catch (e: any) {
      setMsg({ type: "err", text: e?.message || "ทดสอบล้มเหลว" });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className={SHELL}>
      <div className={WRAP}>
        <h1 className="text-2xl md:text-3xl font-semibold mb-6">Integrations · Sales &amp; CRM</h1>

        <div className={CARD}>
          <div className="flex items-center justify-between mb-4">
            <div className="text-lg font-medium">Bitrix24</div>
            <span className={`text-xs px-2 py-1 rounded-full ${validOrg ? "bg-emerald-500/20 text-emerald-300" : "bg-yellow-500/20 text-yellow-300"}`}>
              {validOrg ? "มี orgId (UUID) แล้ว" : "ยังไม่ผูกบริษัท / orgId ไม่ใช่ UUID"}
            </span>
          </div>

          <label className={LABEL}>Webhook URL (โหมดเดียวที่รองรับ)</label>
          <input
            className={INPUT}
            placeholder="https://{portal}.bitrix24.{tld}/rest/{user}/{code}/"
            value={webhook}
            onChange={(e) => setWebhook(e.target.value.trim())}
          />

          <p className="text-xs text-white/50 mt-2">
            ตัวอย่าง: <code>https://synergysoft.bitrix24.com/rest/196/xxxxxxxxxx/</code> (ต้องลงท้ายด้วย <code>/</code>)
          </p>

          <div className="flex gap-3 mt-5">
            <button onClick={onSave} disabled={!canSubmit || saving} className={BTN_PRI}>
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </button>
            <button onClick={onTest} disabled={!canSubmit || testing} className={BTN_SEC}>
              {testing ? "กำลังทดสอบ..." : "ทดสอบการเชื่อมต่อ"}
            </button>
          </div>

          {msg && (
            <div
              className={`mt-4 text-sm rounded-lg px-3 py-2 ${
                msg.type === "ok"
                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                  : "bg-rose-500/15 text-rose-200 border border-rose-500/30"
              }`}
            >
              {msg.text}
            </div>
          )}

          {testResult && (
            <div className="mt-3 text-sm text-white/80">
              <div>ผู้ใช้ทดสอบ: <b>{testResult.name || "-"}</b></div>
              <div>อีเมล: {testResult.email || "-"}</div>
            </div>
          )}

          <div className="mt-6 text-xs text-white/40">
            เคล็ดลับ: ตั้งค่า orgId แบบ UUID ชั่วคราวได้ใน Console:
            <pre className="mt-2 whitespace-pre-wrap break-all bg-black/30 p-2 rounded-lg">{`localStorage.setItem("ceopolar.orgId","00000000-0000-0000-0000-000000000000"); location.reload();`}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
