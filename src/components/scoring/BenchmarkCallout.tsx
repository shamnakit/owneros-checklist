// src/components/scoring/BenchmarkCallout.tsx

export default function BenchmarkCallout({ info }: { info: { industry: string; percentile: number } }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="text-slate-700">
        คุณมีคะแนนมากกว่า <b>{info.percentile}%</b> ของธุรกิจในกลุ่ม <b>{info.industry}</b>
      </div>
      <div className="text-xs text-slate-500 mt-1">
        *หมายเหตุ: เปอร์เซ็นไทล์อ้างอิงฐานข้อมูลนิรนามของผู้ใช้ OwnerOS ในอุตสาหกรรมเดียวกัน
      </div>
    </div>
  );
}
