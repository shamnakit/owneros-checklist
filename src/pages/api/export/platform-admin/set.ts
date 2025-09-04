import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // << ระวัง: ใช้เฉพาะฝั่งเซิร์ฟเวอร์
);

// กันไว้ชั้นหนึ่งด้วย secret token ของแอปเอง
const APP_ADMIN_API_TOKEN = process.env.APP_ADMIN_API_TOKEN!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    if (req.headers.authorization !== `Bearer ${APP_ADMIN_API_TOKEN}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { userId, makeAdmin } = req.body as { userId: string; makeAdmin: boolean };
    if (!userId || typeof makeAdmin !== "boolean") {
      return res.status(400).json({ error: "Invalid payload" });
    }

    const { error } = await supabaseAdmin.rpc("admin_set_platform_admin", {
      target_user: userId,
      make_admin: makeAdmin,
    });
    if (error) throw error;

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
