// src/pages/sources.tsx — CEOPolar Data Sources (M1, fixed 405 + orgId in POST)

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { CheckCircle2, Link as LinkIcon, RefreshCcw, Upload, Radio, AlertTriangle } from "lucide-react";

type SourceView = {
  id: string;
  code: string;
  name: string;
  kind: string;
  active: boolean;
  created_at: string;
  last_sync?: { status: string; started_at: string; finished_at?: string; message?: string } | null;
};

function SourcesPageImpl() {
  const { profile } = useUserProfile();
  const orgId = (profile as any)?.id || "";

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

  // ---- API helper (supports ?query and JSON body) ----
  async function api(path: string, init?: RequestInit & { query?: Record<string, string> }) {
    const url = new URL(path, window.location.origin);
    if (init?.query) Object.entries(init.query).forEach(([k, v]) => url.searchParams.set(k, String(v)));
    const res = await fetch(url.toString(), {
      method: init?.method || "GET",
      headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
      body: init?.body,
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j?.error || `HTTP ${res.status}`);
    }
    return res.json();
  }

  // ---- Load list (GET + ?orgId=) ----
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
  }, [orgId]);

  // ---- Save Bitrix (POST + orgId in body) ----
  async function saveBitrix() {
    try {
      setBxSaving(true);
      await api("/api/sources", {
        method: "POST",
        body: JSON.stringify({
          orgId, // << สำคัญ
          code: "bitrix_main",
          name: "Bitrix24 (Deals)",
          kind: "bitrix",
          credentials: { mode: "webhook", baseUrl: bxBaseUrl.trim(), userId: bxUserId.trim(), webhook: bxWebhook.trim() },
        }),
      });
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

  // ---- Test (POST + orgId in body) ----
  async function testSource(id: string) {
    try {
      setTestingId(id);
      const j = await api("/api/sources/test", {
        method: "POST",
        body: JSON.stringify({ orgId, sourceId: id }),
      });
      alert(`ทดสอบสำเร็จ (${j.kind}) • sample=${j.sample ?? "ok"}`);
    } catch (e: any) {
      alert("ทดสอบไม่สำเร็จ: " + (e?.message || "unknown"));
    } finally {
      setTestingId(null);
    }
  }

  // ---- Sync (POST + orgId in body) ----
  async function syncSource(id: string) {
    try {
      setSyncingId(id);
      const j = await api("/api/sources/sync", {
        method: "POST",
        body: JSON.stringify({ orgId, sourceId: id }),
      });
      alert(`ซิงก์สำเร็จ: ${j.kind} • ${j.from} → ${j.to}`);
      await load();
    } catch (e: any) {
      alert("ซิงก์ไม่สำเร็จ: " + (e?.message || "unknown"));
    } finally {
      setSyncingId(null);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-[var(--text-1)]">Data Sources</h1>

      {/* Existing Sources */}
      <div className="panel-dark">
        <div className="p-4 flex items-center justify-between">
          <div className="panel-title">แหล่งข้อมูลที่เชื่อมอยู่</div>
          <button className="btn-outline inline-flex items-center gap-2" onClick={load} disabled={loading}>
            <RefreshCcw size={16} /> โหลดใหม่
          </button>
        </div>
        {err && <div className="p-4 text-rose-300">{err}</div>}
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {sources.map((s) => (
            <div key={s.id} className="panel-dark p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{s.name}</div>
                  <div className="text-xs muted">
                    {s.code} • {s.kind}
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full border ${
                    s.active ? "text-emerald-300 border-emerald-400/30" : "text-rose-300 border-rose-400/30"
                  }`}
                >
                  {s.active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="text-xs muted">
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
                <button className="btn-outline inline-flex items-center gap-2 text-xs" onClick={() => testSource(s.id)} disabled={!!testingId}>
                  <Radio size={14} /> {testingId === s.id ? "กำลังทดสอบ…" : "Test"}
                </button>
                <button className="btn-primary inline-flex items-center gap-2 text-xs" onClick={() => syncSource(s.id)} disabled={!!syncingId}>
                  <LinkIcon size={14} /> {syncingId === s.id ? "กำลังซิงก์…" : "Sync now"}
                </button>
              </div>
            </div>
          ))}
          {!sources.length && <div className="p-4 text-sm muted">ยังไม่มีแหล่งข้อมูล กรอกแบบฟอร์มด้านล่างเพื่อเชื่อมแหล่งข้อมูลแรกของคุณ</div>}
        </div>
      </div>

      {/* Add Source: Bitrix */}
      <div className="panel-dark">
        <div className="p-4">
          <div className="panel-title mb-3">เชื่อม Bitrix24 (Deals → SalesDaily)</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              className="input-dark"
              placeholder="Base URL (เช่น https://YOUR.bitrix24.com)"
              value={bxBaseUrl}
              onChange={(e) => setBxBaseUrl(e.target.value)}
            />
            <input className="input-dark" placeholder="User ID (ตัวเลขหลัง /rest/ เช่น 1)" value={bxUserId} onChange={(e) => setBxUserId(e.target.value)} />
            <input className="input-dark" placeholder="Webhook token" value={bxWebhook} onChange={(e) => setBxWebhook(e.target.value)} />
          </div>
          <div className="mt-3">
            <button
              className="btn-primary inline-flex items-center gap-2"
              onClick={saveBitrix}
              disabled={!bxBaseUrl || !bxUserId || !bxWebhook || bxSaving}
            >
              <CheckCircle2 size={16} /> {bxSaving ? "กำลังบันทึก…" : "บันทึก & เปิดใช้งาน"}
            </button>
          </div>
          {hasBitrix && <div className="text-xs muted mt-2">* มี Bitrix source แล้ว 1 รายการ</div>}
        </div>
      </div>

      {/* CSV Uploaders */}
      <div className="panel-dark">
        <div className="p-4">
          <div className="panel-title mb-3">อัปโหลด CSV (Manual)</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <CsvUploader title="Sales (รายวัน)" endpoint="/api/import/sales-csv" orgId={orgId} sample="date,channel,net_amount,gross_amount,orders" />
            <CsvUploader title="AR Aging" endpoint="/api/import/ar-aging-csv" orgId={orgId} sample="as_of_date,bucket,amount" />
            <CsvUploader title="NPS" endpoint="/api/import/nps-csv" orgId={orgId} sample="date,respondent_id,score,comment" />
          </div>
          <div className="text-xs muted mt-3 flex items-center gap-2">
            <AlertTriangle size={14} className="text-amber-300" />
            ไฟล์ต้องเป็น UTF-8 / มี header คอลัมน์ตามตัวอย่าง
          </div>
        </div>
      </div>
    </div>
  );
}

function CsvUploader({ title, endpoint, orgId, sample }: { title: string; endpoint: string; orgId: string; sample: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function upload() {
    if (!file) return;
    setBusy(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "x-org-id": orgId }, // CSV endpoints ของเราอ่าน orgId จาก header
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
    <div className="panel-dark p-3">
      <div className="font-semibold">{title}</div>
      <div className="text-xs muted mb-2">
        ตัวอย่าง header: <code>{sample}</code>
      </div>
      <div className="flex items-center gap-2">
        <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] || null)} className="input-dark" />
        <button className="btn-outline inline-flex items-center gap-2" onClick={upload} disabled={!file || busy}>
          <Upload size={14} /> {busy ? "กำลังอัปโหลด…" : "อัปโหลด"}
        </button>
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(SourcesPageImpl), { ssr: false });
