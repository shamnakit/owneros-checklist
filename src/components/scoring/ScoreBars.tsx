import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";

export default function ScoreBars({
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
    { key: "กลยุทธ์", score: data.strategy },
    { key: "โครงสร้างองค์กร", score: data.org },
    { key: "คู่มือปฏิบัติ", score: data.operations },
    { key: "บุคคล/HR", score: data.hr },
    { key: "การเงิน", score: data.finance },
    { key: "ลูกค้า/ขาย", score: data.sales },
  ];

  return (
    <div className="w-full h-64">
      <ResponsiveContainer>
        <BarChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <XAxis dataKey="key" tick={{ fontSize: 12 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="score" name="คะแนน" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
