// src/pages/api/integrations/sync.ts
import type { NextApiRequest, NextApiResponse } from "next";

// MVP: ยังไม่ยิง Bitrix จริง แค่ตอบกลับให้ UI ทำงานได้
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }
  // TODO: อนาคตอ่าน sourceId จาก query, ดึง credentials จาก data_sources แล้วค่อย trigger job
  return res.status(200).json({ success: true, message: "sync started (stub)" });
}
