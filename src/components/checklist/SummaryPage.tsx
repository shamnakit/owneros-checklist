// src/components/checklist/SummaryPage.tsx

export default function SummaryPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">📊 Summary</h2>
      <p className="text-slate-600">หน้านี้สรุปภาพรวมการประเมินแบบ v1.6 (Balanced): แยก “Score%” ออกจาก “%Progress”</p>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border bg-white">
          <div className="font-semibold text-slate-800">Score%</div>
          <p className="text-sm text-slate-600 mt-1">
            วัดคุณภาพ/ความครบถ้วน (ถ่วงน้ำหนัก) — คิดจากคะแนนที่ได้ ÷ 600 × 100
          </p>
        </div>
        <div className="p-4 rounded-xl border bg-white">
          <div className="font-semibold text-slate-800">%Progress</div>
          <p className="text-sm text-slate-600 mt-1">
            วัดความคืบหน้าเชิงปริมาณ — นับรายการที่ “ติ๊กและมีหลักฐาน” ÷ รายการทั้งหมด × 100
          </p>
        </div>
      </div>

      <div className="p-4 rounded-xl border bg-white">
        <div className="font-semibold text-slate-800 mb-2">เกณฑ์ค่าเริ่มต้น</div>
        <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
          <li>ระดับองค์กร: ผ่านขั้นต่ำ = <b>Score ≥ 70%</b> และ <b>%Progress ≥ 80%</b>; Excellent = <b>Score ≥ 85%</b> และ <b>%Progress ≥ 90%</b></li>
          <li>ระดับหมวด: Floor = <b>Score ≥ 60%</b> และ <b>%Progress ≥ 70%</b></li>
        </ul>
      </div>
    </div>
  );
}
