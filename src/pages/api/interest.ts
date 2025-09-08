// pages/api/interest.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  const { plan, name, email, phone, company } = req.body || {};
  console.log("pricing_interest", { plan, name, email, phone, company, ts: Date.now() });

  // Optional: ส่งเข้าห้อง Slack ถ้ามี webhook
  try {
    if (process.env.SLACK_WEBHOOK_URL) {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `Pricing interest: ${plan}\n${name} <${email}> (${phone})\n${company || "-"}`,
        }),
      });
    }
  } catch (e) {
    console.error("Slack forward error", e);
  }

  return res.status(200).json({ ok: true });
}
