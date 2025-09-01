// /src/pages/api/export/export-binder.ts
import type { NextApiRequest, NextApiResponse } from "next";
import ExcelJS from "exceljs";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

// Config สำหรับ Pages Router
export const config = {
  api: { bodyParser: false, responseLimit: false },
};

type TotalRow = {
  user_id: string;
  year_version: number;
  total_score: number;
  max_score: number;
  tier_label: "Excellent" | "Developing" | "Early Stage";
};

type CatRow = {
  category: "strategy" | "structure" | "sop" | "hr" | "finance" | "sales" | "addon";
  score: number;
  max_score_category: number;
  evidence_rate_pct: number;
};

type WarnRow = {
  category: CatRow["category"];
  checklist_id: string;
  name: string;
  score_points: number;
};

const CAT_LABEL: Record<CatRow["category"], string> = {
  strategy: "Strategy",
  structure: "Structure",
  sop: "SOP",
  hr: "HR",
  finance: "Finance",
  sales: "Sales",
  addon: "Add-on",
};

const toNum = (x: any) => (Number.isFinite(Number(x)) ? Number(x) : 0);
const tierTH = (t: TotalRow["tier_label"]) =>
  t === "Excellent" ? "Excellent" : t === "Developing" ? "Developing" : "Early Stage";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "GET") {
      res.status(405).json({ error: "Method Not Allowed" });
      return;
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const STORAGE_BUCKET = process.env.BINDER_BUCKET || "binders";

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      const missing = [
        !SUPABASE_URL && "NEXT_PUBLIC_SUPABASE_URL",
        !SUPABASE_ANON_KEY && "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        !SUPABASE_SERVICE_ROLE_KEY && "SUPABASE_SERVICE_ROLE_KEY",
      ].filter(Boolean);
      res.status(500).json({ error: `Missing environment variables: ${missing.join(", ")}` });
      return;
    }

    // 1) DB client (ใช้ session ผู้ใช้จาก cookies → RPC for_me จะเห็นข้อมูลเหมือนหน้าเว็บ)
    const db = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        get: (name: string) => (req.cookies ? req.cookies[name] : undefined),
        set: () => {},
        remove: () => {},
      },
    });

    // 2) Service client ใช้เฉพาะตอน upload storage
    const svc = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const userId = (req.query.userId as string) || (req.body as any)?.userId; // ใช้แค่บันทึก/ชื่อไฟล์
    const year = Number((req.query.year as string) || (req.body as any)?.year);
    const companyName =
      (req.query.companyName as string) ||
      (req.body as any)?.companyName ||
      "My Company";
    const uploadParam =
      (req.query.upload as string) ??
      ((req.body as any)?.upload != null ? String((req.body as any)?.upload) : "0");
    const upload = uploadParam === "1" || uploadParam === "true";

    if (!year) {
      res.status(400).json({ error: "Missing year" });
      return;
    }

    // === ดึงข้อมูลด้วย RPC (เหมือนหน้า Dashboard) ===
    // รวมคะแนนทั้งองค์กร
    const { data: totalRPC, error: et } = await db.rpc("fn_score_total_for_me", {
      p_year: year,
      p_require_evidence: true,
    });
    if (et) {
      console.warn("[export-binder] fn_score_total_for_me error:", et.message);
    }
    let total: TotalRow | undefined = (totalRPC as any)?.[0];
    if (total) {
      (total as any).total_score = toNum((total as any).total_score);
      (total as any).max_score = toNum((total as any).max_score);
    }

    // รายหมวด
    let catsArr: CatRow[] = [];
    try {
      const { data: catsRPC, error: ec } = await db.rpc("fn_score_by_category_for_me", {
        p_year: year,
        p_require_evidence: true,
      });
      if (ec) throw ec;
      catsArr = (Array.isArray(catsRPC) ? catsRPC : []) as CatRow[];
    } catch (err: any) {
      console.warn("[export-binder] fn_score_by_category_for_me failed:", err?.message);
      catsArr = [];
    }

    // รายการติ๊กแล้วไม่มีไฟล์ (optional)
    let warnsArr: WarnRow[] = [];
    try {
      const { data: warnsRPC, error: ew } = await db.rpc("fn_checked_without_evidence_for_me", {
        p_year: year,
      });
      if (ew) throw ew;
      warnsArr = (Array.isArray(warnsRPC) ? warnsRPC : []) as WarnRow[];
    } catch {
      // ไม่มีฟังก์ชันนี้ก็ไม่เป็นไร
      warnsArr = [];
    }

    // ถ้า total ว่าง ให้ fallback จาก cats
    if (!total) {
      const core = catsArr.filter((c) => c.category !== "addon");
      const total_score = core.reduce((s, r) => s + toNum(r.score), 0);
      const max_score = core.reduce((s, r) => s + toNum(r.max_score_category), 0);
      const scorePct = max_score > 0 ? (total_score / max_score) * 100 : 0;
      const progressPct =
        core.length > 0 ? core.reduce((s, r) => s + toNum(r.evidence_rate_pct), 0) / core.length : 0;

      let tier_label: TotalRow["tier_label"] = "Early Stage";
      if (scorePct >= 85 && progressPct >= 90) tier_label = "Excellent";
      else if (scorePct >= 70 && progressPct >= 80) tier_label = "Developing";

      total = {
        user_id: String(userId || ""),
        year_version: year,
        total_score,
        max_score,
        tier_label,
      };
    }

    // === สร้างไฟล์ Excel ===
    const wb = new ExcelJS.Workbook();
    wb.creator = "OwnerOS";
    wb.created = new Date();

    // Sheet 1: Summary
    const ws1 = wb.addWorksheet("Summary", { properties: { tabColor: { argb: "2E7D32" } } });
    ws1.columns = [
      { header: "Field", key: "field", width: 24 },
      { header: "Value", key: "value", width: 60 },
    ];
    ws1.addRows([
      { field: "Company", value: companyName },
      { field: "Year", value: year },
      { field: "Total Score", value: total ? `${toNum(total.total_score)} / ${toNum(total.max_score)}` : "-" },
      { field: "Tier", value: total ? tierTH(total.tier_label) : "-" },
      { field: "Generated At", value: new Date().toISOString() },
    ]);
    ws1.getRow(1).font = { bold: true };
    ws1.getColumn(1).font = { bold: true };

    // Sheet 2: Categories (มาจาก RPC เดียวกับ Dashboard)
    const ws2 = wb.addWorksheet("Categories");
    ws2.columns = [
      { header: "Category", key: "category", width: 20 },
      { header: "Score", key: "score", width: 12 },
      { header: "Max Score", key: "max", width: 12 },
      { header: "Evidence Rate (%)", key: "evidence", width: 18 },
    ];
    ws2.getRow(1).font = { bold: true };
    const coreCats = catsArr.filter((r) => r.category !== "addon");
    if (coreCats.length === 0) {
      ws2.addRow({ category: "N/A (no data from RPC)", score: "", max: "", evidence: "" });
    } else {
      coreCats.forEach((r) => {
        ws2.addRow({
          category: CAT_LABEL[r.category],
          score: toNum(r.score),
          max: toNum(r.max_score_category),
          evidence: toNum(r.evidence_rate_pct),
        });
      });
    }

    // Sheet 3: Warnings (optional)
    const ws3 = wb.addWorksheet("Warnings");
    ws3.columns = [
      { header: "Category", key: "category", width: 18 },
      { header: "Checklist", key: "name", width: 60 },
      { header: "Score Points", key: "points", width: 14 },
    ];
    ws3.getRow(1).font = { bold: true };
    if (warnsArr.length === 0) {
      ws3.addRow({ category: "N/A", name: "No data or RPC not available", points: "" });
    } else {
      warnsArr.forEach((w) => {
        ws3.addRow({
          category: CAT_LABEL[w.category],
          name: w.name,
          points: toNum(w.score_points),
        });
      });
    }

    // เขียนเป็นไฟล์
    const arrayBuffer = await wb.xlsx.writeBuffer();

    // อัปโหลด (ใช้ service role) หรือดาวน์โหลดตรง
    if (upload) {
      await svc.storage.createBucket(STORAGE_BUCKET, { public: false }).catch(() => {});
      const filename = `binder_${companyName.replace(/\s+/g, "_")}_${year}_${Date.now()}.xlsx`;
      const blob = new Blob([arrayBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const { error: upErr } = await svc.storage
        .from(STORAGE_BUCKET)
        .upload(filename, blob, {
          contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          upsert: false,
        });
      if (upErr) {
        console.error("[export-binder] upload error:", upErr);
        res.status(500).json({ error: "Upload failed", detail: upErr.message });
        return;
      }
      const { data: signed, error: signErr } = await svc.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(filename, 60 * 60);
      if (signErr || !signed?.signedUrl) {
        console.error("[export-binder] sign error:", signErr);
        res.status(500).json({ error: "Create signed URL failed", detail: signErr?.message });
        return;
      }
      res.status(200).json({ url: signed.signedUrl, filename });
      return;
    }

    const safeName = `Binder_${companyName.replace(/[^\w\-]+/g, "_")}_${year}.xlsx`;
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${safeName}"`);
    const nodeBuffer = Buffer.isBuffer(arrayBuffer) ? (arrayBuffer as Buffer) : Buffer.from(arrayBuffer as ArrayBuffer);
    res.status(200).send(nodeBuffer);
  } catch (err: any) {
    console.error("[export-binder] fatal error:", err);
    res.status(500).json({ error: err?.message || "Export failed" });
  }
}
