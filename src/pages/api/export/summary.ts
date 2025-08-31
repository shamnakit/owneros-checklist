import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/utils/supabaseClient"; // ใช้ได้ถ้า RPC อนุญาต anonymous + RLS ถูกต้อง

type CatRow = { category: string; score: number; max_score_category: number; evidence_rate_pct: number; };

const MAIN_CAT = ["strategy","structure","sop","hr","finance","sales"];
const LABEL: Record<string,string> = {
  strategy:"กลยุทธ์องค์กร", structure:"โครงสร้างองค์กร", sop:"คู่มือปฏิบัติงาน",
  hr:"ระบบบุคคล & HR", finance:"ระบบการเงิน", sales:"ระบบลูกค้า / ขาย",
};
const FLOOR = { scorePct: 60, progressPct: 70 };

const esc = (v: any) => {
  if (v == null) return "";
  const s = String(v).replace(/"/g, '""');
  return /[",\n]/.test(s) ? `"${s}"` : s;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "GET") { res.status(405).send("Method Not Allowed"); return; }
    const year = Number(req.query.year ?? new Date().getFullYear());

    const [{ data: catRows, error: e2 }] = await Promise.all([
      supabase.rpc("fn_score_by_category_for_me", { p_year: year, p_require_evidence: true }),
    ]);
    if (e2) throw e2;

    const byKey: Record<string, CatRow|undefined> = {};
    (catRows as CatRow[]).forEach((r) => { byKey[String(r.category).toLowerCase()] = r; });

    const meta = [
      ["Report","OwnerOS Summary v1.6 Balanced"],
      ["Year", String(year)],
      ["GeneratedAt", new Date().toISOString()],
      []
    ];
    const header = ["CategoryKey","CategoryNameTH","ScoreObtained","ScoreMax","ScorePct(%)","ProgressPct(%)","SectionStatus"];
    const body = MAIN_CAT.map((k) => {
      const r = byKey[k];
      const max = Number(r?.max_score_category ?? 0);
      const score = Number(r?.score ?? 0);
      const scorePct = max > 0 ? Math.round((score / max) * 100) : 0;
      const progressPct = Math.max(0, Math.min(100, Math.round(Number(r?.evidence_rate_pct ?? 0))));
      const passed = scorePct >= FLOOR.scorePct && progressPct >= FLOOR.progressPct;
      return [k, LABEL[k], score, max, scorePct, progressPct, passed ? "PASS" : "FAIL"];
    });

    const rows = [...meta, header, ...body];
    const csv = rows.map((r) => r.map(esc).join(",")).join("\r\n");
    const buff = Buffer.from("\ufeff" + csv, "utf8");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=owneros_summary_${year}.csv`);
    res.status(200).send(buff);
  } catch (err: any) {
    console.error("API /export/summary error:", err);
    res.status(500).json({ error: err?.message || "Export failed" });
  }
}
