// src/components/charts/RadarSix.tsx
import React from "react";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from "recharts";
import { moonColors } from "@/theme/moonship";

type D = { name: string; value: number };
export default function RadarSix({ data }: { data: D[] }) {
  return (
    <div className="card-moon p-4">
      <div className="text-sm font-semibold mb-2">ภาพรวมความพร้อม 6 หมวด</div>
      <div style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer>
          <RadarChart data={data}>
            <PolarGrid stroke="rgba(255,255,255,0.15)" />
            <PolarAngleAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.8)", fontSize: 12 }} />
            <PolarRadiusAxis tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 10 }} stroke="rgba(255,255,255,0.1)" />
            <Tooltip
              contentStyle={{ background: "rgba(15,30,46,0.95)", border: "1px solid rgba(255,255,255,0.08)", color: "#E6EDF5", borderRadius: 12 }}
              labelStyle={{ color: "#E6EDF5" }}
              formatter={(v: any) => [`${Number(v).toFixed(0)}%`, "พร้อม"]}
            />
            <Radar dataKey="value" stroke={moonColors.category.strategy} fill={moonColors.category.strategy} fillOpacity={0.25} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ตัวอย่าง data ที่ต้องส่งเข้า:
// [
//   { name: "Strategy", value: 62 },
//   { name: "Org", value: 54 },
//   { name: "SOP", value: 48 },
//   { name: "HR", value: 71 },
//   { name: "Finance", value: 58 },
//   { name: "Sales", value: 66 },
// ]
