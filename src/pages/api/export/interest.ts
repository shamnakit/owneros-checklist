// pages/api/interest.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const { plan, name, email, phone, company } = req.body || {};
  // TODO: บันทึกลง Supabase/Sheet/Email
  console.log("interest:", { plan, name, email, phone, company });
  return res.status(200).json({ ok: true });
}
