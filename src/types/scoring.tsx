// src/types/scoring.ts

// หมวดคะแนนหลัก 6 หมวด
export type ScoreBucketKey =
  | "strategy"
  | "org"
  | "operations"
  | "hr"
  | "finance"
  | "sales";

// โครงสร้างคะแนนรายหมวด + หมวดย่อย (optional)
export type ScoreBuckets = Record<ScoreBucketKey, number> & {
  optional?: number;
};

// ระดับ Tier ของคะแนนรวม
export type TierLevel = "Excellent" | "Developing" | "Early";

// ค่าคะแนนเต็มต่อหมวด (ใช้สำหรับอ้างอิง)
export const BUCKET_FULL: Record<ScoreBucketKey, number> = {
  strategy: 100,
  org: 100,
  operations: 100,
  hr: 100,
  finance: 100,
  sales: 100,
};

// ค่าสูงสุดของหมวดย่อย + คะแนนรวมสูงสุด
export const OPTIONAL_MAX = 50; // หมวดย่อยเสริม
export const TOTAL_MAX = 650;   // 6*100 + 50

export function clamp(n: number, min = 0, max = 9999): number {
  return Math.max(min, Math.min(max, n));
}

// รวมคะแนนจากทุกหมวด (บีบค่าแต่ละหมวดให้อยู่ในช่วงที่ถูกต้อง)
export function sumBuckets(s: ScoreBuckets): number {
  const base =
    clamp(s.strategy, 0, 100) +
    clamp(s.org, 0, 100) +
    clamp(s.operations, 0, 100) +
    clamp(s.hr, 0, 100) +
    clamp(s.finance, 0, 100) +
    clamp(s.sales, 0, 100);

  const opt = clamp(s.optional ?? 0, 0, OPTIONAL_MAX);
  return base + opt;
}

// แปลงคะแนนรวมเป็น Tier
export function toTier(total: number): TierLevel {
  if (total >= 550) return "Excellent";
  if (total >= 400) return "Developing";
  return "Early";
}

// สี badge สำหรับ Tier
export function tierBadgeColor(t: TierLevel): string {
  switch (t) {
    case "Excellent":
      return "bg-emerald-600/90 text-white";
    case "Developing":
      return "bg-amber-500/90 text-white";
    default:
      return "bg-slate-500/90 text-white";
  }
}
