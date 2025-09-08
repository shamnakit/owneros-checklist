// src/components/ScoreRadarChart.tsx
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { useMemo } from "react";

/** โครงข้อมูลหลัก: ใช้ "คะแนนที่ตัดเกรด" เป็นเปอร์เซ็นต์ (0–100) */
export interface CategoryScore {
  category: string;     // เช่น "Strategy", "Org Structure", ...
  scorePct: number;     // คะแนนที่ใช้ตัดเกรด แปลงเป็น % แล้ว (0..100)
  progressPct?: number; // (เสริม) %ความคืบหน้า ใช้โชว์ใน Tooltip ได้
}

type Props = {
  current: CategoryScore[];      // ปีปัจจุบัน (หรือปีที่เลือก)
  previous?: CategoryScore[];    // ปีเทียบ (ถ้าไม่ส่ง จะวาดเส้นเดียว)
  labelCurrent?: string;         // เช่น "ปี 2025"
  labelPrevious?: string;        // เช่น "ปี 2024"
  targetLinePct?: number;        // เช่น 70 (ถ้าอยากโชว์เส้นเป้าหมาย)
};

/** ลิสต์ลำดับหมวดมาตรฐาน เพื่อให้แกนคงที่และไม่สลับ */
const DEFAULT_ORDER = [
  "Strategy",
  "Org Structure",
  "SOP",
  "HR",
  "Finance",
  "Sales",
];

function fmtPct(n: number) {
  return (
    n.toLocaleString("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + "%"
  );
}

type Merged = {
  category: string;
  current?: number;
  previous?: number;
  progressCurrent?: number;
  progressPrevious?: number;
};

/** รวม category ตามลำดับมาตรฐาน + แม็พคะแนนเป็น data ชุดเดียวสำหรับ RadarChart */
function buildChartData(
  current: CategoryScore[],
  previous?: CategoryScore[]
): Merged[] {
  const map = new Map<string, Merged>();

  for (const c of current) {
    map.set(c.category, {
      ...(map.get(c.category) || { category: c.category }),
      current: clamp01to100(c.scorePct),
      progressCurrent: c.progressPct,
    });
  }
  if (previous) {
    for (const p of previous) {
      map.set(p.category, {
        ...(map.get(p.category) || { category: p.category }),
        previous: clamp01to100(p.scorePct),
        progressPrevious: p.progressPct,
      });
    }
  }

  // เรียงตาม DEFAULT_ORDER ก่อน แล้วต่อด้วยหมวดอื่นที่นอกลิสต์ (ถ้ามี)
  const orderedKeys = [
    ...DEFAULT_ORDER,
    ...Array.from(map.keys()).filter((k) => !DEFAULT_ORDER.includes(k)),
  ];

  return orderedKeys
    .filter((k) => map.has(k))
    .map((k) => map.get(k)!) as Merged[];
}

function clamp01to100(n: number | undefined) {
  if (n == null || isNaN(n)) return 0;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return n;
}

export default function ScoreRadarChart({
  current,
  previous,
  labelCurrent = "ปีปัจจุบัน",
  labelPrevious = "ปีก่อน",
  targetLinePct, // เช่น 70 เพื่อโชว์ baseline
}: Props) {
  const data = useMemo(() => buildChartData(current, previous), [current, previous]);

  return (
    <div className="w-full h-96">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid />
          <PolarAngleAxis
            dataKey="category"
            // ถ้าชื่อไทยยาว สามารถใส่ tickFormatter มาย่อคำได้ภายหลัง
          />
          {/* 🔒 ล็อกสเกลเป็น 0–100 เสมอ (ไม่ให้ Auto-scale) */}
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tickFormatter={(v) => `${v}`}
          />

          {/* ซีรีส์ปีปัจจุบัน (คะแนนที่ใช้ตัดเกรด) */}
          <Radar
            name={labelCurrent}
            dataKey="current"
            stroke="#2563eb"      // น้ำเงิน
            fill="#2563eb"
            fillOpacity={0.35}
          />

          {/* ซีรีส์ปีเทียบ (ถ้ามี) */}
          {previous && (
            <Radar
              name={labelPrevious}
              dataKey="previous"
              stroke="#10b981"    // เขียว
              fill="#10b981"
              fillOpacity={0.25}
            />
          )}

          {/* (ตัวเลือก) เส้นเป้าหมาย เช่น 70% */}
          {typeof targetLinePct === "number" && targetLinePct >= 0 && targetLinePct <= 100 && (
            // เทคนิค: ใช้ Radar โปร่งใสเพื่อสร้าง "วงเส้น" เท่ากับ target
            // โดยกำหนดค่าทุกแกน = targetLinePct (วาดเส้นรอบรูป)
            <Radar
              name={`Target ${targetLinePct}%`}
              dataKey={() => targetLinePct}
              stroke="#9ca3af"  // เทา
              fillOpacity={0}
              isAnimationActive={false}
            />
          )}

          <Tooltip
            // Tooltip แสดง Score% + ส่วนต่าง Δ (ถ้ามี previous) และโชว์ Progress% (ถ้ามี)
            formatter={(value: any, name: string, props: any) => {
              const v = Number(value);
              const s = fmtPct(v);
              if (name === labelCurrent && props?.payload?.previous != null) {
                const prev = Number(props.payload.previous);
                const diff = v - prev;
                const sign = diff >= 0 ? "+" : "";
                return [`${s} (${sign}${diff.toFixed(2)}%)`, "คะแนน"];
              }
              return [s, "คะแนน"];
            }}
            labelFormatter={(label: any, payload: any) => {
              // ดึง progressPct ถ้ามีเพื่อแสดงประกอบ
              const p = Array.isArray(payload) && payload.length > 0 ? payload[0].payload : null;
              const progCur =
                typeof p?.progressCurrent === "number"
                  ? ` • Progress: ${fmtPct(p.progressCurrent)}`
                  : "";
              const progPrev =
                typeof p?.progressPrevious === "number"
                  ? ` | Prev: ${fmtPct(p.progressPrevious)}`
                  : "";
              return `หมวด: ${label}${progCur}${progPrev}`;
            }}
          />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
