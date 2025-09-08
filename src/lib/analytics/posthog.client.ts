// src/lib/analytics/posthog.client.ts
import type { PostHog } from "posthog-js";

/** ทำให้แน่ใจว่าไฟล์นี้เป็น ES module แม้ตอน build จะ tree-shake บางอย่าง */
export {};

let loaded = false;
let queue: Array<{ name: string; props?: Record<string, any> }> = [];

/** ใช้เรียกครั้งเดียวในฝั่ง client (เช่นที่ _app.tsx) */
export function initPostHog() {
  if (typeof window === "undefined") return; // SSR guard
  if (loaded || (window as any).__phLoaded) return;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";
  const debug = process.env.NEXT_PUBLIC_POSTHOG_DEBUG === "1";

  if (!key) return;

  import("posthog-js")
    .then(({ default: posthog }) => {
      // กัน init ซ้ำกรณีมี posthog อยู่แล้ว
      if ((window as any).posthog?.__loaded) {
        loaded = true;
        (window as any).__phLoaded = true;
        flushQueue();
        return;
      }

      posthog.init(key as string, {
        api_host: host,
        capture_pageview: false, // เราจะยิง $pageview เองใน _app.tsx
        autocapture: true,
        persistence: "localStorage",
        loaded: (ph) => {
          // tag ว่าโหลดแล้วกัน HMR
          (ph as any).__loaded = true;
          (window as any).posthog = ph as unknown as PostHog;
          loaded = true;
          (window as any).__phLoaded = true;
          flushQueue();
          if (debug) safeLog("[posthog] init loaded");
        },
      });
    })
    .catch(() => {
      // เงียบ ๆ ถ้าโหลด lib ไม่สำเร็จ
    });
}

export function track(name: string, props: Record<string, any> = {}) {
  if (typeof window === "undefined") return;
  const ph = (window as any).posthog as PostHog | undefined;

  if (!ph || !loaded) {
    queue.push({ name, props });
    return;
  }
  try {
    ph.capture(name, props);
  } catch {
    // no-op
  }
}

/** ระบุผู้ใช้หลังล็อกอิน */
export function identify(distinctId: string, props?: Record<string, any>) {
  const ph = getPH();
  if (!ph) return;
  try {
    ph.identify(distinctId, props);
  } catch {}
}

/** เคลียร์ identity/props ตอนล็อกเอาท์ */
export function reset() {
  const ph = getPH();
  if (!ph) return;
  try {
    ph.reset();
  } catch {}
}

/** ลงทะเบียน props ถาวร (ติดไปกับทุกอีเวนต์) */
export function register(props: Record<string, any>) {
  const ph = getPH();
  if (!ph) {
    // ถ้ายังไม่โหลด เก็บไว้ยิงตอน flush แทน
    queue.push({ name: "__register__", props });
    return;
  }
  try {
    ph.register(props);
  } catch {}
}

// ──────────────────────────────────────────────────────────────
// Helpers
function getPH(): PostHog | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as any).posthog as PostHog | undefined;
}

function flushQueue() {
  const ph = getPH();
  if (!ph) return;
  const pending = [...queue];
  queue = [];
  for (const evt of pending) {
    if (evt.name === "__register__") {
      try {
        ph.register(evt.props || {});
      } catch {}
      continue;
    }
    try {
      ph.capture(evt.name, evt.props || {});
    } catch {}
  }
}

function safeLog(...args: any[]) {
  // เปิด log เฉพาะตอน debug
  if (process.env.NEXT_PUBLIC_POSTHOG_DEBUG === "1") {
    try {
      // eslint-disable-next-line no-console
      console.log(...args);
    } catch {}
  }
}
