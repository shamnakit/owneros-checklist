// /src/pages/api/analytics/funnel.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { phInsights } from "@/lib/analytics/posthog.server";

/**
 * GET /api/analytics/funnel
 * Query:
 *  - date_from: string (default "-14d")
 *  - date_to: string (optional)
 *  - breakdown: string (optional) -> e.g. "$current_url" or "company_plan"
 *  - steps: comma-separated list (accepts alias or real event names)
 *
 * Default alias mapping (Bizzystem):
 *  visit           -> "Dashboard Viewed"
 *  signup          -> "signup"
 *  activated       -> "Score Recomputed"
 *  export_attempt  -> "Export Binder"
 *  pricing_interest-> "Pricing CTA Clicked"
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

    // steps: accept alias or real names; comma-separated or multi-param
    const rawSteps = Array.isArray(req.query.steps)
      ? req.query.steps.join(",")
      : (req.query.steps as string) || "";

    // alias → real event mapping
    const ALIAS_MAP: Record<string, string> = {
      visit: "Dashboard Viewed",
      signup: "signup",
      activated: "Score Recomputed",
      export_attempt: "Export Binder",
      pricing_interest: "Pricing CTA Clicked",
    };

    const parsedSteps = rawSteps
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    // if user didn't provide steps → use default aliases
    const sourceSteps = parsedSteps.length
      ? parsedSteps
      : ["visit", "signup", "activated", "export_attempt", "pricing_interest"];

    // map alias → real; if not an alias, treat as real event name
    const finalSteps = sourceSteps.map((keyOrName) => {
      const realName = ALIAS_MAP[keyOrName] || keyOrName;
      return {
        id: realName,      // PostHog expects `id`
        name: realName,    // helpful label
        type: "events" as const,
      };
    });

    // ---- build Insights body ----
    const body: any = {
      insight: "FUNNELS",
      date_from,
      events: finalSteps,
      breakdown: breakdown || null,
    };
    if (date_to) body.date_to = date_to;

    // ---- call PostHog (server helper posts to /api/projects/:id/insights/) ----
    const data = await phInsights(body);

    // small caching for dashboards
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
    return res.status(200).json(data);
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "PostHog funnel error" });
  }
}
