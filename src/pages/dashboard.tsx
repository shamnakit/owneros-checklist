// /src/pages/dashboard.tsx
import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { Download, AlertTriangle } from "lucide-react";

type RadarRow = {
  category: string;
  score2025: number;
  score2024: number;
};

type BarRow = {
  name: string;
  value: number;
  status: "warning" | "ok" | "down";
};

const dataRadar: RadarRow[] = [
  { category: "Strategy", score2025: 60, score2024: 40 },
  { category: "Structure", score2025: 100, score2024: 90 },
  { category: "SOP", score2025: 50, score2024: 70 },
  { category: "HR", score2025: 80, score2024: 60 },
  { category: "Finance", score2025: 70, score2024: 80 },
  { category: "Sales", score2025: 85, score2024: 70 },
];

const dataBars: BarRow[] = [
  { name: "Strategy", value: 60, status: "warning" },
  { name: "Structure", value: 100, status: "ok" },
  { name: "SOP", value: 50, status: "warning" },
  { name: "HR", value: 80, status: "ok" },
  { name: "Finance", value: 70, status: "down" },
  { name: "Sales", value: 85, status: "ok" },
];

function pct(n: number) {
  // แสดงเลขตาม preference: 2 ทศนิยม + คอมม่า
  return `${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
}

export default function DashboardPage() {
  const totalScore = 480;
  const maxScore = 650;

  const percent = useMemo(
    () => (totalScore / maxScore) * 100,
    [totalScore, maxScore]
  );

  return (
    <div className="p-6 grid gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">บริษัท ABC Co., Ltd.</h1>
          <p className="text-muted-foreground">ปี 2025</p>
        </div>
        <Button className="bg-green-600 text-white flex gap-2">
          <Download size={18} /> Export XLSX Binder
        </Button>
      </div>

      {/* Score & Tier */}
      <Card className="shadow-lg">
        <div className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-4xl font-bold">
              {totalScore.toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}{" "}
              / {maxScore.toLocaleString()}
            </h2>
            <p className="text-gray-600">
              {pct(percent)} ความพร้อม
            </p>
          </div>
          <div className="text-center">
            <span className="px-4 py-2 rounded-2xl bg-yellow-100 text-yellow-700 font-semibold">
              Tier: Developing
            </span>
            <p className="text-sm text-gray-500 mt-1">
              คุณดีกว่า 67% ของธุรกิจ F&amp;B SME
            </p>
          </div>
        </div>
      </Card>

      {/* Radar Chart */}
      <Card className="shadow-md">
        <div className="p-6">
          <h3 className="font-semibold mb-2">
            Radar Chart (เทียบ 2024 vs 2025)
          </h3>
          <ResponsiveContainer width="100%" height={350}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={dataRadar}>
              <PolarGrid />
              <PolarAngleAxis dataKey="category" />
              <PolarRadiusAxis />
              {/* สีสามารถปรับตาม theme ได้ภายหลัง */}
              <Radar
                name="2025"
                dataKey="score2025"
                stroke="#16a34a"
                fill="#16a34a"
                fillOpacity={0.6}
              />
              <Radar
                name="2024"
                dataKey="score2024"
                stroke="#9ca3af"
                fill="#9ca3af"
                fillOpacity={0.3}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Progress Bars */}
      <Card className="shadow-md">
        <div className="p-6">
          <h3 className="font-semibold mb-4">ความคืบหน้าตามหมวด</h3>

          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dataBars}>
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="value" fill="#16a34a" />
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-4 space-y-2">
            {dataBars.map((item) => (
              <div key={item.name} className="flex justify-between items-center">
                <span>{item.name}</span>
                {item.status === "warning" && (
                  <span className="flex items-center text-yellow-600 text-sm">
                    <AlertTriangle size={14} className="mr-1" /> หลักฐานไม่ครบ
                  </span>
                )}
                {item.status === "down" && (
                  <span className="text-red-600 text-sm">ลดลงจากปีก่อน</span>
                )}
                {item.status === "ok" && (
                  <span className="text-green-700 text-sm">เรียบร้อย</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Next Steps */}
      <Card className="shadow-md">
        <div className="p-6">
          <h3 className="font-semibold mb-2">คำแนะนำถัดไป</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>อัปโหลดไฟล์คู่มือ SOP → ปลดล็อกไฟเหลือง</li>
            <li>ติดตั้ง Module River KPI → เพิ่มคะแนน Strategy</li>
          </ul>
          <Button className="mt-4 bg-blue-600 text-white">ไปยัง Checklist</Button>
        </div>
      </Card>
    </div>
  );
}
