// /src/pages/api/export/export-binder.ts
import type { NextApiRequest, NextApiResponse } from "next";
import ExcelJS from "exceljs";
import { createClient } from "@supabase/supabase-js";

// ✅ ใช้รูปแบบ config ของ Pages Router โดยไม่ใส่ "as const"
export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

type TotalRow = {
  user_id: string;
  year_version: number;
  total_score: number;
  max_score: number;
  tier_label: "Excellent" | "Developing" | "Early Stage";
};

type CatRow = {
  user_id: string;
  year_version: number;
  category: "strategy" | "structure" | "sop" | "hr" | "finance" | "sales" | "addon";
  score: number;
  max_score_category: number;
  evidence_rate_pct: number;
};

type WarnRow = {
  user_id: string;
  year_version: number;
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

function thaiTier(t: TotalRow["tier_label"]) {
  if (t === "Excellent") return "Excellent";
  if (t === "Developing") return "Developing";
  return "Early Stage";
}

const esc = (v: any) => {
  if (v == null) return "";
  const s = String(v).replace(/"/g, '""');
  return /[",\n]/.test(s) ? `"${s}"` : s;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "GET") {
      res.status(405).json({ error: "Method Not Allowed" });
      return;
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const STORAGE_BUCKET = process.env.BINDER_BUCKET || "binders";

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      const missing = [
        !SUPABASE_URL ? "NEXT_PUBLIC_SUPABASE_URL" : null,
        !SUPABASE_SERVICE_ROLE_KEY ? "SUPABASE_SERVICE_ROLE_KEY" : null,
      ].filter(Boolean);
      res.status(500).json({ error: `Missing environment variables: ${missing.join(", ")}` });
      return;
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const userId = (req.query.userId as string) || (req.body as any)?.userId;
    const year = Number((req.query.year as string) || (req.body as any)?.year);
    const companyName =
      (req.query.companyName as string) ||
      (req.body as any)?.companyName ||
      "My Company";
    const uploadParam =
      (req.query.upload as string) ??
      ((req.body as any)?.upload != null ? String((req.body as any)?.upload) : "0");
    const upload = uploadParam === "1" || uploadParam === "true";

    if (!userId || !year) {
      res.status(400).json({ error: "Missing userId or year" });
      return;
    }

    // 1) ดึงข้อมูลจากวิว
    const [
      { data: totalRows, error: e1 },
      { data: cats, error: e2 },
      { data: warnsRaw, error: e3 },
    ] = await Promise.all([
      supabase.from("vw_score_total").select("*").eq("user_id", userId).eq("year_version", year).limit(1),
      supabase.from("vw_score_by_category").select("*").eq("user_id", userId).eq("year_version", year),
      supabase.from("vw_checked_without_evidence").select("*").eq("user_id", userId).eq("year_version", year),
    ]);

    if (e1) {
      console.error("[export-binder] vw_score_total error:", e1);
      res.status(500).json({ error: "Query vw_score_total failed", detail: e1.message });
      return;
    }
    if (e2) {
      console.error("[export-binder] vw_score_by_category error:", e2);
      res.status(500).json({ error: "Query vw_score_by_category failed", detail: e2.message });
      return;
    }
    if (e3) {
      console.warn("[export-binder] vw_checked_without_evidence error (ignored):", e3.message);
    }

    const total: TotalRow | undefined = (totalRows as TotalRow[] | null)?.[0];
    const warns: WarnRow[] = Array.isArray(warnsRaw) ? (warnsRaw as WarnRow[]) : [];

    // 2) สร้าง Workbook
    const wb = new ExcelJS.Workbook();
    wb.creator = "OwnerOS";
    wb.created = new Date();

    /** Sheet 1: Summary */
    const ws1 = wb.addWorksheet("Summary", { properties: { tabColor: { argb: "2E7D32" } } });
    ws1.columns = [
      { header: "Field", key: "field", width: 24 },
      { header: "Value", key: "value", width: 60 },
    ];
    ws1.addRows([
      { field: "Company", value: companyName },
      { field: "Year", value: year },
      { field: "Total Score", value: total ? `${total.total_score} / ${total.max_score}` : "-" },
      { field: "Tier", value: total ? thaiTier(total.tier_label) : "-" },
      { field: "Generated At", value: new Date().toISOString() },
    ]);
    ws1.getRow(1).font = { bold: true };
    ws1.getColumn(1).font = { bold: true };
    ws1.getColumn(1).alignment = { vertical: "middle" };
    ws1.getColumn(2).alignment = { vertical: "middle" };

    /** Sheet 2: Categories */
    const ws2 = wb.addWorksheet("Categories");
    ws2.columns = [
      { header: "Category", key: "category", width: 20 },
      { header: "Score", key: "score", width: 12 },
      { header: "Max Score", key: "max", width: 12 },
      { header: "Evidence Rate (%)", key: "evidence", width: 18 },
    ];
    ws2.getRow(1).font = { bold: true };
    ((cats as CatRow[]) || []).forEach((r) => {
      if (r.category === "addon") return;
      ws2.addRow({
        category: CAT_LABEL[r.category],
        score: r.score,
        max: r.max_score_category,
        evidence: r.evidence_rate_pct,
      });
    });

    /** Sheet 3: Warnings */
    const ws3 = wb.addWorksheet("Warnings");
    ws3.columns = [
      { header: "Category", key: "category", width: 18 },
      { header: "Checklist", key: "name", width: 60 },
      { header: "Score Points", key: "points", width: 14 },
    ];
    ws3.getRow(1).font = { bold: true };
    (warns || []).forEach((w) => {
      ws3.addRow({
        category: CAT_LABEL[w.category],
        name: w.name,
        points: w.score_points,
      });
    });

    // 3) สร้างไฟล์
    const arrayBuffer = await wb.xlsx.writeBuffer();

    if (upload) {
      // 4) อัปโหลดขึ้น Storage แล้วคืนลิงก์
      try {
        await supabase.storage.createBucket(STORAGE_BUCKET, { public: false }).catch(() => {});
        const filename = `binder_${companyName.replace(/\s+/g, "_")}_${year}_${Date.now()}.xlsx`;
        const blob = new Blob([arrayBuffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const { error: upErr } = await supabase.storage
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
        const { data: signed, error: signErr } = await supabase.storage
          .from(STORAGE_BUCKET)
          .createSignedUrl(filename, 60 * 60);
        if (signErr || !signed?.signedUrl) {
          console.error("[export-binder] sign error:", signErr);
          res.status(500).json({ error: "Create signed URL failed", detail: signErr?.message });
          return;
        }
        res.status(200).json({ url: signed.signedUrl, filename });
        return;
      } catch (e: any) {
        console.error("[export-binder] upload caught error:", e);
        res.status(500).json({ error: "Upload failed (exception)", detail: e?.message });
        return;
      }
    }

    // 5) ส่งดาวน์โหลดตรง
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
