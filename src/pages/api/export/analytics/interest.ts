//src/pages/api/analytics/interest.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { phFetch } from "../_posthog";


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const date_from = (req.query.date_from as string) || "-30d";

    const data = await phFetch("/insights/trend", {
      date_from,
      display: "ActionsTable",
      events: [{ id: "pricing_interest", name: "pricing_interest", type: "events" }],
      properties: [],
      breakdown: "plan",          // 👈 ต้องตรงกับ prop ที่ยิงจาก client
      breakdown_type: "event",
    });

    res.status(200).json(data);
  } catch (e: any) {
    res.status(200).json({ fallback: true, error: e.message });
  }
}
