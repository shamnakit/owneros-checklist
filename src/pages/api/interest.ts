// src/pages/api/interest.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method Not Allowed" });

  const { plan, name, email, phone, company } = req.body || {};
  console.log("pricing_interest", { plan, name, email, phone, company, ts: Date.now() });

  try {
    if (process.env.SLACK_WEBHOOK_URL) {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `Pricing interest\nPlan: ${plan}\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nCompany: ${company || "-"}`,
        }),
      });
    }
  } catch (e) {
    console.error("Slack forward error:", e);
  }

  return res.status(200).json({ ok: true });
}
