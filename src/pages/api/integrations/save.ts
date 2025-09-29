// src/pages/api/integrations/save.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/utils/supabaseServer"; // สมมติว่ามี client สำหรับ server side

// กำหนด type ของ Configuration สำหรับ Webhook ของ Bitrix24
interface Bitrix24Config {
  webhook_url: string;
  user_id: string;
  base_url: string;
}

// กำหนดโครงสร้างของ Payload ที่จะส่งเข้ามา
interface SavePayload {
  kind: string; // เช่น 'bitrix24_webhook', 'google_sheet'
  config: Bitrix24Config; // ข้อมูลการตั้งค่า
  name?: string;
  description?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Method Guard: ต้องอนุญาตเฉพาะ POST เท่านั้น
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method Not Allowed (Expected POST)" });
  }

  const orgId = req.query.orgId as string;
  const payload: SavePayload = req.body;

  // 2. Validation: ตรวจสอบ Org ID และ Payload
  if (!orgId) {
    return res.status(400).json({ success: false, error: "Missing orgId in query" });
  }
  if (!payload.kind || !payload.config) {
    return res.status(400).json({ success: false, error: "Missing integration kind or config in body" });
  }
  
  // 3. Validation เฉพาะ Bitrix24
  if (payload.kind === 'bitrix24_webhook') {
      const bxConfig = payload.config as Bitrix24Config;
      if (!bxConfig.base_url || !bxConfig.user_id || !bxConfig.webhook_url) {
          return res.status(400).json({ success: false, error: "Bitrix24 config is incomplete" });
      }
      // สร้างชื่อให้ดูดี ถ้าไม่ได้ระบุมา
      payload.name = payload.name || `Bitrix24 (${bxConfig.base_url.replace('https://', '').split('/')[0]})`;
      payload.description = payload.description || `Webhook for automated data sync.`;
  }
  
  // 4. Database Operation: บันทึกหรืออัปเดตข้อมูลแหล่งที่มา (data_sources)
  try {
    const { data, error } = await supabase
      .from("data_sources")
      .upsert(
        {
          org_id: orgId,
          kind: payload.kind,
          config: payload.config,
          name: payload.name,
          description: payload.description,
          active: true, // เปิดใช้งานทันที
        },
        { 
          onConflict: "org_id, kind", // อัปเดตถ้ามี org_id และ kind ซ้ำกัน (ป้องกันการสร้างหลายตัวซ้ำซ้อน)
          ignoreDuplicates: false,
        }
      )
      .select();

    if (error) throw error;

    return res.status(200).json({ success: true, message: "Integration saved successfully", data });
  } catch (e: any) {
    console.error("Database save failed:", e.message);
    return res.status(500).json({ success: false, error: "Database save failed: " + e.message });
  }
}