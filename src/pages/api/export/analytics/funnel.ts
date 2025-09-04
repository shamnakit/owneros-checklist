// /src/pages/api/analytics/funnel.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { phFetch } from "../_posthog";


/**
 * GET /api/analytics/funnel
 * Query:
 *  - date_from: string (default "-14d")
 *  - date_to: string (optional)
 *  - breakdown: string (optional) -> e.g. "$current_url" or "company_plan"
 *  - steps: comma-separated event names (optional)
 *
 * Defaults mapเข้ากับอีเวนต์ที่เราใช้ใน Bizsystem:
 *  visit -> "Dashboard Viewed"
 *  signup -> "signup"
 *  activated -> "Score Recomputed"
 *  export_attempt -> "Export Binder"
 *  pricing_interest -> "Pricing CTA Clicked"
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // allow only GET
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // ---- read query ----
    const date_from = (req.query.date_from as string) || "-14d";
    const date_to = (req.query.date_to as string) || undefined;
    const breakdown = (req.query.breakdown as string) || null;

    // steps: if provided, use them; else use our sensible defaults
    const stepsQ = (req.query.steps as string) || "";
    const userSteps = stepsQ
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    // map short codes → real PostHog event names we send from the app
    const DEFAULT_EVENT_MAP: Record<string, string> = {
      visit: "Dashboard Viewed",
      signup: "signup",
      activated: "Score Recomputed",
      export_attempt: "Export Binder",
      pricing_interest: "Pricing CTA Clicked",
    };

    const defaultSteps = ["visit", "signup", "activated", "export_attempt", "pricing_interest"].map(
      (k) => DEFAULT_EVENT_MAP[k]
    );

    const finalSteps = (userSteps.length ? userSteps : defaultSteps).map((eventName) => ({
      event: eventName,
      type: "events" as const,
    }));

    // ---- build request body for PostHog ----
    const body: any = {
      insight: "FUNNELS",
      date_from,
      events: finalSteps,
      breakdown: breakdown || null,
    };
    if (date_to) body.date_to = date_to;

    // ---- call PostHog ----
    const data = await phFetch("/insights/funnel", body);

    // small caching for dashboards
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
    return res.status(200).json(data);
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "PostHog funnel error" });
  }
}
