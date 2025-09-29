// src/pages/api/integrations/test.ts

import type { NextApiRequest, NextApiResponse } from "next";

const bad = (res: NextApiResponse, msg: string, code = 400) =>
  res.status(code).json({ ok: false, error: msg });

const isUuid = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return bad(res, "Method Not Allowed", 405);

  const orgId = (req.query.orgId as string) || "";
  if (!orgId.trim()) return bad(res, "Missing orgId in query");
  if (!isUuid(orgId)) return bad(res, "orgId must be a valid UUID");

  const { webhook_url } = (req.body || {}) as { webhook_url?: string };
  if (typeof webhook_url !== "string" || !webhook_url.endsWith("/")) {
    return bad(res, "Invalid webhook_url. Use full webhook ending with '/'");
  }

  const url = `${webhook_url}user.current.json`;

  try {
    const controller = new AbortController();
    const to = setTimeout(() => controller.abort(), 8000);

    const r = await fetch(url, { signal: controller.signal });
    clearTimeout(to);

    const text = await r.text();
    let json: any = null;
    try { json = JSON.parse(text); } catch {}

    if (!r.ok) {
      return res.status(200).json({
        ok: false,
        status: r.status,
        reason: "Bitrix returned non-200",
        raw: text,
      });
    }

    return res.status(200).json({
      ok: true,
      status: r.status,
      result: {
        id: json?.result?.ID,
        name: [json?.result?.NAME, json?.result?.LAST_NAME].filter(Boolean).join(" "),
        email: json?.result?.EMAIL,
      },
    });
  } catch (e: any) {
    return bad(res, `Test failed: ${e?.message || "unknown"}`, 500);
  }
}
