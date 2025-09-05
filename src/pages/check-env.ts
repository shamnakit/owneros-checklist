import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

/** ----------------- helpers ----------------- */
function mask(s?: string, head = 6, tail = 4) {
  if (!s) return "";
  if (s.length <= head + tail + 3) return s.replace(/.(?=.{4})/g, "*");
  return `${s.slice(0, head)}***${s.slice(-tail)}`;
}
function decodeJwtPart(part?: string) {
  try {
    if (!part) return null;
    const json = Buffer.from(part.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}
function parseJwt(jwt?: string) {
  if (!jwt) return null;
  const [h, p] = jwt.split(".");
  return {
    header: decodeJwtPart(h),
    payload: decodeJwtPart(p),
  };
}
function ok<T>(value: T, note?: string) {
  return { ok: true, value, note };
}
function fail(message: string) {
  return { ok: false, error: message };
}

/** ----------------- API handler ----------------- */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Require token
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token || token !== process.env.APP_ADMIN_API_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const out: any = { checks: {} };

  // 1) Read envs (masked)
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const PH_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const PH_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  const PH_PROJ = process.env.POSTHOG_PROJECT_ID;
  const PH_PERSONAL = process.env.POSTHOG_PERSONAL_API_KEY;
  const BINDER_BUCKET = process.env.BINDER_BUCKET;

  out.env = {
    NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL || null,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: mask(ANON_KEY),
    SUPABASE_SERVICE_ROLE_KEY: mask(SERVICE_KEY),
    NEXT_PUBLIC_POSTHOG_KEY: mask(PH_KEY),
    NEXT_PUBLIC_POSTHOG_HOST: PH_HOST || null,
    POSTHOG_PROJECT_ID: PH_PROJ || null,
    POSTHOG_PERSONAL_API_KEY: mask(PH_PERSONAL),
    BINDER_BUCKET: BINDER_BUCKET || null,
  };

  // 2) Validate formats
  out.checks.supabase_url =
    SUPABASE_URL?.startsWith("https://") && SUPABASE_URL?.includes(".supabase.co")
      ? ok(true)
      : fail("NEXT_PUBLIC_SUPABASE_URL looks invalid");

  const anonDecoded = parseJwt(ANON_KEY);
  out.checks.anon_key = anonDecoded?.payload?.role === "anon"
    ? ok({ role: "anon", exp: anonDecoded.payload?.exp })
    : fail("Anon key missing/invalid (role != anon?)");

  const serviceDecoded = parseJwt(SERVICE_KEY);
  out.checks.service_key = serviceDecoded?.payload?.role === "service_role"
    ? ok({ role: "service_role", exp: serviceDecoded.payload?.exp })
    : fail("Service role key missing/invalid (role != service_role?)");

  // 3) Live connectivity checks (safe)
  // 3.1 Supabase (service role): count profiles (HEAD) – no data leakage
  try {
    const supabaseAdmin = createClient(SUPABASE_URL!, SERVICE_KEY!);
    const { count, error } = await supabaseAdmin
      .from("profiles")
      .select("id", { count: "exact", head: true });
    if (error) throw error;
    out.checks.supabase_service_query = ok({ profiles_count_visible: count ?? "head-only" });
  } catch (e: any) {
    out.checks.supabase_service_query = fail(`Service query failed: ${e.message}`);
  }

  // 3.2 Supabase (anon): test a view that should be public if granted (vw_score_by_category fallback)
  try {
    const supabaseAnon = createClient(SUPABASE_URL!, ANON_KEY!);
    const { data, error } = await supabaseAnon
      .from("vw_score_by_category")
      .select("*")
      .limit(1);
    if (error) throw error;
    out.checks.supabase_anon_query = ok({ sample: data?.[0] ?? null }, "vw_score_by_category accessible");
  } catch (e: any) {
    out.checks.supabase_anon_query = fail(
      `Anon query failed on vw_score_by_category: ${e.message} (Grant select to anon or adjust view name)`
    );
  }

  // 3.3 PostHog config sanity (no external call here)
  const phHostOk = !!PH_HOST && /^https?:\/\//.test(PH_HOST);
  const phKeyOk = !!PH_KEY && PH_KEY.startsWith("phc_");
  out.checks.posthog_public = phHostOk && phKeyOk ? ok(true) : fail("Missing/invalid NEXT_PUBLIC_POSTHOG_*");

  const phSrvOk = !!PH_PERSONAL && PH_PERSONAL.startsWith("phc_") && !!PH_PROJ;
  out.checks.posthog_server = phSrvOk ? ok(true) : fail("Missing/invalid POSTHOG_PROJECT_ID / POSTHOG_PERSONAL_API_KEY");

  // 3.4 Storage bucket name presence
  out.checks.bucket = BINDER_BUCKET ? ok(BINDER_BUCKET) : fail("BINDER_BUCKET not set");

  // 4) Summary status
  const failures = Object.entries(out.checks).filter(([, v]: any) => !v.ok);
  out.status = failures.length === 0 ? "OK" : `PARTIAL (${failures.length} failing checks)`;

  return res.status(200).json(out);
}
