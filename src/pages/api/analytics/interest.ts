// src/pages/api/analytics/interest.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { phInsights } from "@/lib/analytics/posthog.server";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // allow only GET
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const date_from = (req.query.date_from as string) || "-30d";
    const interval = (req.query.interval as string) || "day";
    const display = (req.query.display as string) || "ActionsTable";

    // รับหลายรูปแบบ: ?events=a,b หรือ ?events=a&events=b
    const rawEvents = Array.isArray(req.query.events)
      ? req.query.events.join(",")
      : (req.query.events as string) || "";

    // รองรับ breakdown แบบยืดหยุ่น
    const breakdown = (req.query.breakdown as string) || "plan"; // 👈 ต้องตรงกับ prop ที่ยิงจาก client
    const breakdown_type =
      (req.query.breakdown_type as "event" | "person" | "cohort" | "session") || "event";

    // alias → real event mapping (ใช้มาตรฐานเดียวกับ funnel.ts)
    const ALIAS_MAP: Record<string, string> = {
      visit: "Dashboard Viewed",
      signup: "signup",
      activated: "Score Recomputed",
      export_attempt: "Export Binder",
      pricing_interest: "Pricing CTA Clicked",
    };

    // ถ้าไม่ส่ง events มาเลย → ใช้ default = pricing_interest
    const sourceEvents = (rawEvents
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)).length
      ? rawEvents.split(",").map((s) => s.trim()).filter(Boolean)
      : ["pricing_interest"];

    // map alias → real name (ถ้าไม่ใช่ alias จะถือว่าเป็นชื่อ event จริง)
    const series = sourceEvents.map((keyOrName) => {
      const real = ALIAS_MAP[keyOrName] || keyOrName;
      return { event: real, name: real, type: "events", math: "total" as const };
    });

    const body: any = {
      insight: "TRENDS",
      date_from,
      interval,
      display,   // "ActionsTable" by default
      series,
    };

    // แนบ breakdown เฉพาะเมื่อกำหนด key มา
    if (breakdown) {
      body.breakdown = breakdown;
      body.breakdown_type = breakdown_type;
    }

    const data = await phInsights(body);

    // caching เบา ๆ สำหรับแดชบอร์ด
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
    return res.status(200).json(data);
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "PostHog interest error" });
  }
}
