// /src/pages/api/export-binder.ts
import type { NextApiRequest, NextApiResponse } from "next";
import ExcelJS from "exceljs";
import { createClient } from "@supabase/supabase-js";

/** --- CONFIG --- */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!; // server only
const STORAGE_BUCKET = process.env.BINDER_BUCKET || "binders"; // ตั้งชื่อ bucket ได้

// ดึงข้อมูลจาก views (ใช้ service key เพื่อความเร็ว/เสถียรบน server)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const userId = (req.query.userId as string) || (req.body?.userId as string);
    const year = Number((req.query.year as string) || (req.body?.year as string));
    const companyName = (req.query.companyName as string) || (req.body?.companyName as string) || "My Company";
    const upload = (req.query.upload as string) === "1" || (req.body?.upload === true);

    if (!userId || !year) {
      res.status(400).json({ error: "Missing userId or year" });
      return;
    }

    // 1) โหลดข้อมูลจริงจาก views
    const [{ data: totalRows, error: e1 }, { data: cats, error: e2 }, { data: warns, error: e3 }] =
      await Promise.all([
        supabase.from("vw_score_total").select("*").eq("user_id", userId).eq("year_version", year).limit(1),
        supabase.from("vw_score_by_category").select("*").eq("user_id", userId).eq("year_version", year),
        supabase.from("vw_checked_without_evidence").select("*").eq("user_id", userId).eq("year_version", year),
      ]);

    if (e1 || e2 || e3) {
      throw new Error((e1 || e2 || e3)?.message || "Query error");
    }

    const total: TotalRow | undefined = totalRows?.[0] as any;

    // 2) สร้าง Workbook
    const wb = new ExcelJS.Workbook();
    wb.creator = "OwnerOS";
    wb.created = new Date();

    /** Sheet 1: Summary */
    const ws1 = wb.addWorksheet("Summary", { properties: { tabColor: { argb: "2E7D32" } } });
    ws1.columns = [
      { header: "Field", key: "field", width: 24 },
      { header: "Value", key: "value", width: 50 },
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

    (cats as CatRow[] || []).forEach((r) => {
      if (r.category === "addon") return; // ไม่เอาแผ่น addon มาปนกราฟหลัก
      ws2.addRow({
        category: CAT_LABEL[r.category],
        score: r.score,
        max: r.max_score_category,
        evidence: r.evidence_rate_pct,
      });
    });

    /** Sheet 3: Warnings (ติ๊กแล้วไม่มีไฟล์) */
    const ws3 = wb.addWorksheet("Warnings");
    ws3.columns = [
      { header: "Category", key: "category", width: 18 },
      { header: "Checklist", key: "name", width: 60 },
      { header: "Score Points", key: "points", width: 14 },
    ];
    ws3.getRow(1).font = { bold: true };

    (warns as WarnRow[] || []).forEach((w) => {
      ws3.addRow({
        category: CAT_LABEL[w.category],
        name: w.name,
        points: w.score_points,
      });
    });

    // 3) สร้างไฟล์ Buffer
    const buffer = await wb.xlsx.writeBuffer();

    // 4) ถ้าขอ upload ให้เก็บลง Supabase Storage แล้วส่ง URL กลับ
    if (upload) {
      // สร้าง bucket ถ้ายังไม่มี (ignore error ถ้ามีแล้ว)
      await supabase.storage.createBucket(STORAGE_BUCKET, { public: false }).catch(() => {});
      const filename = `binder_${companyName.replace(/\s+/g, "_")}_${year}_${Date.now()}.xlsx`;
      const { error: upErr } = await supabase.storage.from(STORAGE_BUCKET).upload(filename, buffer, {
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        upsert: false,
      });
      if (upErr) throw upErr;

      // สร้าง signed URL คืน
      const { data: signed, error: signErr } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(filename, 60 * 60); // 1 ชั่วโมง
      if (signErr) throw signErr;

      res.status(200).json({ url: signed.signedUrl, filename });
      return;
    }

    // 5) ส่งไฟล์ให้ดาวน์โหลดตรง ๆ
    const safeName = `Binder_${companyName.replace(/[^\w\-]+/g, "_")}_${year}.xlsx`;
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${safeName}"`);
    res.status(200).send(Buffer.from(buffer));
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err?.message || "Export failed" });
  }
}
