// src/pages/summary/index.tsx
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ScoreTierBadge from "@/components/scoring/ScoreTierBadge";
import ScoreRadar from "@/components/scoring/ScoreRadar";
import ScoreBars from "@/components/scoring/ScoreBars";
import BenchmarkCallout from "@/components/scoring/BenchmarkCallout";
import { sumBuckets, TOTAL_MAX, OPTIONAL_MAX } from "@/types/scoring";

type ScoresShape = {
  strategy: number;
  org: number;
  operations: number;
  hr: number;
  finance: number;
  sales: number;
  optional?: number;
};

export default function SummaryPage() {
  // 🧪 MOCK: สมมติได้คะแนนจากการติ๊ก Checklist + แนบไฟล์แล้ว
  const [scores, setScores] = useState<ScoresShape>({
    strategy: 65,
    org: 80,
    operations: 55,
    hr: 70,
    finance: 62,
    sales: 75,
    optional: 25, // จากหมวดย่อย (0–50)
  });

  const total = useMemo(() => sumBuckets(scores as any), [scores]);

  // 🧪 MOCK Benchmark
  const benchPercentile = 67;
  const benchIndustry = "Food & Beverage";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ภาพรวมคะแนนองค์กร (OwnerOS Scoring)</h1>
          <div className="mt-2 flex items-center gap-3">
            <ScoreTierBadge total={total} />
            <div className="text-sm text-slate-500">
              คะแนนรวม: <b>{total}</b> / {TOTAL_MAX} &nbsp;·&nbsp; หมวดย่อย: สูงสุด {OPTIONAL_MAX}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Export XLSX</Button>
          <Button>สร้าง Binder (PDF เร็ว ๆ นี้)</Button>
        </div>
      </div>

      {/* Benchmark Callout */}
      <BenchmarkCallout info={{ percentile: benchPercentile, industry: benchIndustry }} />

      {/* Radar & Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <h2 className="font-semibold mb-3">ภาพเรดาร์ตามหมวด</h2>
          <ScoreRadar data={scores} />
        </Card>
        <Card className="p-4">
          <h2 className="font-semibold mb-3">คะแนนรายหมวด (0–100)</h2>
          <ScoreBars data={scores} />
        </Card>
      </div>

      {/* Manual adjust (demo) */}
      <Card className="p-4">
        <h2 className="font-semibold mb-3">ปรับคะแนน (สำหรับเดโม / ทดสอบ)</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {(Object.keys(scores) as Array<keyof ScoresShape>).map((k) => (
            <div key={k as string} className="flex items-center gap-2">
              <label className="w-28 capitalize text-sm text-slate-600">{k}</label>
              <Input
                type="number"
                value={Number(scores[k] ?? 0)}
                onChange={(e) =>
                  setScores((prev) => ({ ...prev, [k]: Number(e.target.value || 0) }))
                }
              />
            </div>
          ))}
        </div>
        <div className="text-xs text-slate-500 mt-2">
          *ใส่ค่าระหว่าง 0–100 ต่อหมวด และ 0–50 สำหรับ optional (ระบบจริงจะคำนวณอัตโนมัติจาก Checklist + หลักฐาน)
        </div>
      </Card>
    </div>
  );
}
