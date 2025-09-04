// src/lib/analytics/posthog.server.ts
export type PostHogInsightBody = Record<string, any>;

/** Server helper เรียก PostHog Insights API */
export async function phInsights<T = any>(body: PostHogInsightBody): Promise<T> {
  const base = process.env.POSTHOG_BASE_URL || "https://app.posthog.com";
  const projectId = process.env.POSTHOG_PROJECT_ID;
  const token = process.env.POSTHOG_PERSONAL_API_KEY;

  if (!projectId || !token) {
    throw new Error("Missing POSTHOG_PROJECT_ID or POSTHOG_PERSONAL_API_KEY");
  }

  const resp = await fetch(`${base}/api/projects/${projectId}/insights/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`PostHog error ${resp.status}: ${text}`);
  }
  return resp.json();
}
