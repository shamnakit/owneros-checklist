// src/pages/api/_debug/inspect-key.ts
import type { NextApiRequest, NextApiResponse } from "next";
function safeDecode(jwt?: string) {
  try { if (!jwt) return null;
    const p = jwt.split("."); if (p.length < 2) return null;
    return JSON.parse(Buffer.from(p[1], "base64").toString("utf8"));
  } catch { return null; }
}
export default function handler(_: NextApiRequest, res: NextApiResponse) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const payload = safeDecode(key);
  res.status(200).json({ present: !!key, role: payload?.role, iss: payload?.iss });
}
