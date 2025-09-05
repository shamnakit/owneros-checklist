// src/components/ScoreRadarChart.tsx
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, Legend
} from "recharts";

export interface CategoryScore {
  category: string;      // เช่น "Strategy", "Org Structure", ...
  percentage: number;    // 0..100 (ทศนิยม 2 ตำแหน่งได้)
}

type Props = {
  current: CategoryScore[];          // ปีปัจจุบัน (หรือปีที่เลือก)
  previous?: CategoryScore[];        // ปีเทียบ (ถ้าไม่ส่ง จะวาดเส้นเดียว)
  labelCurrent?: string;             // ชื่อชุดข้อมูล เช่น "ปี 2025"
  labelPrevious?: string;            // เช่น "ปี 2024"
};

function fmtPct(n: number) {
  return n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%";
}

/** รวม category ของ current/previous แล้วแม็พเป็น data ชุดเดียวให้ RadarChart */
function buildChartData(current: CategoryScore[], previous?: CategoryScore[]) {
  const map = new Map<string, { current?: number; previous?: number }>();

  for (const r of current) {
    map.set(r.category, { ...(map.get(r.category) || {}), current: r.percentage });
  }
  if (previous) {
    for (const r of previous) {
      map.set(r.category, { ...(map.get(r.category) || {}), previous: r.percentage });
    }
  }

  // ถ้า category ไหนขาดด้านใดด้านหนึ่ง ให้เติม 0 เพื่อวาดครบแกน
  return Array.from(map.entries()).map(([category, v]) => ({
    category,
    current: v.current ?? 0,
    previous: v.previous ?? 0,
  }));
}

export default function ScoreRadarChart({
  current,
  previous,
  labelCurrent = "ปีปัจจุบัน",
  labelPrevious = "ปีก่อน",
}: Props) {
  const data = buildChartData(current, previous);

  return (
    <div className="w-full h-96">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="category" />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tickFormatter={(v) => `${v}`} />
          
          {/* ซีรีส์ปีปัจจุบัน */}
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

          <Tooltip
            formatter={(value: any, name: string) => [fmtPct(Number(value)), name]}
            labelFormatter={(label: any) => `หมวด: ${label}`}
          />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
