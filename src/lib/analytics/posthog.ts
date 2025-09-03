// src/lib/analytics/posthog.ts
import type { PostHog } from "posthog-js";

/** ทำให้แน่ใจว่าไฟล์นี้เป็น ES module แม้ตอน build จะ tree-shake บางอย่าง */
export {};

let loaded = false;

export function initPostHog() {
  // ใช้เฉพาะฝั่ง client
  if (typeof window === "undefined") return;
  if (loaded) return;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host =
    process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";
  if (!key) return;

  // dynamic import เพื่อไม่ให้ SSR ดึงเข้าบันเดิลฝั่ง server
  import("posthog-js")
    .then(({ default: posthog }) => {
      if ((window as any).posthog) return; // กัน init ซ้ำ
      posthog.init(key as string, {
        api_host: host,
        capture_pageview: false,
        autocapture: true,
        persistence: "localStorage",
      });
      (window as any).posthog = posthog as unknown as PostHog;
      loaded = true;

      try {
        posthog.capture("$pageview", { page: "landing" });
      } catch {}
    })
    .catch(() => {});
}

export function track(name: string, props: Record<string, any> = {}) {
  if (typeof window === "undefined") return;
  const ph = (window as any).posthog as any;
  if (!ph) return;
  try {
    ph.capture(name, props);
  } catch {}
}
