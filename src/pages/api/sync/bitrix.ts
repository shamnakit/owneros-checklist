// /src/pages/api/sync/bitrix.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { pullDealsWonDaily } from "@/connectors/bitrix/deals";
import { upsertSalesDaily } from "@/connectors/persist";

const TZ = "Asia/Bangkok";
const INTERNAL_KEY = process.env.INTERNAL_SYNC_KEY || ""; // ตั้งค่าใน env เพื่อบังคับให้มี x-internal-key

type Creds =
  | { mode: "webhook"; baseUrl: string; userId: string; webhook: string }
  | { mode: "oauth"; baseUrl: string; accessToken: string };

function isISORangeValid(from?: string, to?: string) {
  if (!from || !to) return false;
  const df = new Date(from);
  const dt = new Date(to);
  return !Number.isNaN(+df) && !Number.isNaN(+dt) && df <= dt;
}

function sanitizeBaseUrl(url: string) {
  try {
    const u = new URL(url);
    return u.origin; // ตัด path/queries ออก ป้องกันใส่ซ้อน
  } catch {
    return "";
  }
}

function validateCreds(c: Creds): Creds | null {
  if (!c || typeof c !== "object") return null;
  if (c.mode === "webhook") {
    const base = sanitizeBaseUrl(c.baseUrl);
    if (!base || !c.userId || !c.webhook) return null;
    return { ...c, baseUrl: base };
  }
  if (c.mode === "oauth") {
    const base = sanitizeBaseUrl(c.baseUrl);
    if (!base || !c.accessToken) return null;
    return { ...c, baseUrl: base };
  }
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const requestId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  try {
    // 1) Method & content-type guard
    if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed", requestId });
    if (!/application\/json/i.test(req.headers["content-type"] || "")) {
      return res.status(415).json({ error: "unsupported_media_type", requestId });
    }

    // 2) Internal key (ถ้าตั้งค่าไว้ใน env)
    if (INTERNAL_KEY) {
      const k = String(req.headers["x-internal-key"] || "");
      if (!k || k !== INTERNAL_KEY) return res.status(401).json({ error: "unauthorized", requestId });
    }

    // 3) Org guard
    const orgId = String(req.headers["x-org-id"] || "");
    if (!orgId) return res.status(400).json({ error: "missing x-org-id", requestId });

    // 4) Body validation
    const { from, to, creds } = req.body as { from?: string; to?: string; creds?: Creds };
    if (!isISORangeValid(from, to)) {
      return res.status(400).json({ error: "invalid_date_range (from/to)", requestId });
    }
    const safeCreds = validateCreds(creds as Creds);
    if (!safeCreds) {
      return res.status(400).json({ error: "invalid_creds", requestId });
    }

    // 5) Pull & persist
    // หมายเหตุ: ให้ pullDealsWonDaily คืน [{ date: 'YYYY-MM-DD', amount: number, currency?: string }, ...]
    const rows = await pullDealsWonDaily(safeCreds, from!, to!);
    await upsertSalesDaily(orgId, rows);

    // 6) Response พร้อมข้อมูลที่ใช้แสดง Freshness
    const lastRefreshedAt = new Date().toISOString();
    return res.json({
      ok: true,
      requestId,
      inserted: rows.length,
      from,
      to,
      tz: TZ,
      lastRefreshedAt,
    });

  } catch (err: any) {
    // แยก error แบบปลอดภัย
    const message = (err && err.message) ? String(err.message) : "bitrix_sync_failed";
    const status =
      /unauthor/i.test(message) ? 401 :
      /forbid|denied/i.test(message) ? 403 :
      /rate|limit/i.test(message) ? 429 :
      500;

    return res.status(status).json({ error: message, requestId });
  }
}
