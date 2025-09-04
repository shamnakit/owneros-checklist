// src/pages/api/analytics/trends.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { phInsights } from "@/lib/analytics/posthog.server";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // รองรับพารามิเตอร์จาก query
    const date_from = (req.query.date_from as string) || "-14d";
    const interval = (req.query.interval as string) || "day";
    // events: รับได้ทั้ง comma-separated หรือซ้ำหลายครั้ง ?events=a&events=b
    const q = req.query.events;
    const eventsParam = Array.isArray(q) ? q : (q ? q.split(",") : null);

    const defaultEvents = ["signup", "activated", "export_attempt"];
    const events = (eventsParam && eventsParam.length > 0) ? eventsParam : defaultEvents;

    const series = events.map((id) => ({
      event: id,
      name: id,
      type: "events",
      math: "total",
    }));

    const body = {
      insight: "TRENDS",
      date_from,
      interval,
      display: "ActionsLineGraph",
      series,
    };

    const data = await phInsights(body);
    res.status(200).json(data);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "PostHog request failed" });
  }
}
