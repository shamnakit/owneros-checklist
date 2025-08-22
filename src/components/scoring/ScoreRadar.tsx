// File: src/components/scoring/ScoreRadar.tsx
import { ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis } from "recharts";

export default function ScoreRadar({
  data,
}: {
  data: {
    strategy: number;
    org: number;
    operations: number;
    hr: number;
    finance: number;
    sales: number;
  };
}) {
  const rows = [
    { key: "กลยุทธ์", value: data.strategy },
    { key: "โครงสร้างองค์กร", value: data.org },
    { key: "คู่มือปฏิบัติ", value: data.operations },
    { key: "บุคคล/HR", value: data.hr },
    { key: "การเงิน", value: data.finance },
    { key: "ลูกค้า/ขาย", value: data.sales },
  ];
  return (
    <div className="w-full h-80">
      <ResponsiveContainer>
        <RadarChart data={rows} outerRadius={110}>
          <PolarGrid />
          <PolarAngleAxis dataKey="key" tick={{ fontSize: 12 }} />
          <Radar name="คะแนน" dataKey="value" fillOpacity={0.4} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
