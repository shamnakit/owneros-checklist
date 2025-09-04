// /src/pages/api/_posthog.ts
type HttpMethod = "GET" | "POST";

function required(name: string, v?: string) {
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

/**
 * phFetch: เรียก PostHog API (Insights) ด้วย Bearer token
 * ต้องตั้ง env:
 *  - POSTHOG_HOST (เช่น https://app.posthog.com)
 *  - POSTHOG_PERSONAL_API_KEY (Personal API Key)
 *  - POSTHOG_PROJECT_ID (ตัวเลข id ของโปรเจกต์)
 */
export async function phFetch(
  path: string,
  body?: any,
  method: HttpMethod = "POST"
): Promise<any> {
  const host = process.env.POSTHOG_HOST || "https://app.posthog.com";
  const token = required("POSTHOG_PERSONAL_API_KEY", process.env.POSTHOG_PERSONAL_API_KEY);
  const projectId = required("POSTHOG_PROJECT_ID", process.env.POSTHOG_PROJECT_ID);

  // ทำให้ path นำหน้าด้วย "/" เสมอ
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  // Insights ใช้ endpoint ภายใต้ /api/projects/:id
  const url = `${host}/api/projects/${projectId}${cleanPath}`;

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: method === "POST" ? JSON.stringify(body ?? {}) : undefined,
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`PostHog ${res.status} ${res.statusText} – ${msg}`);
  }
  return res.json();
}
