// src/pages/api/analytics/trends.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const r = await fetch(
      `https://app.posthog.com/api/projects/${process.env.POSTHOG_PROJECT_ID}/insights/trend/`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.POSTHOG_PERSONAL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          events: [
            { id: "signup", type: "events" },
            { id: "activated", type: "events" },
            { id: "export_attempt", type: "events" },
          ],
          date_from: "-14d",
          interval: "day",
          display: "ActionsLineGraph",
        }),
      }
    );

    const data = await r.json();
    res.status(200).json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}
