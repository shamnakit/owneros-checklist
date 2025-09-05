//src/pages/admin/exports/index.tsx

import Link from "next/link";
import { FileArchive, PlusCircle, Shield, Activity, Clock } from "lucide-react";

export default function AdminExportsPage() {
  // เดโม่ข้อมูลล่าสุด 3 รายการ (ต่อจริงค่อยเรียกจาก DB)
  const recent = [
    { id: "EXP-2025-0001", template: "Owner Binder v1", by: "ceo@acme.com", at: "2025-09-03 14:12", status: "done" },
    { id: "EXP-2025-0002", template: "Due Diligence Lite", by: "cfo@acme.com", at: "2025-09-03 11:02", status: "done" },
    { id: "EXP-2025-0003", template: "Bank Loan Pack", by: "op@acme.com", at: "2025-09-02 18:27", status: "queued" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">ดาวน์โหลดรายงาน (ผู้ดูแลระบบ)</h1>
        <Link
          href="/admin/exports/templates"
          className="inline-flex items-center gap-2 rounded-xl border border-neutral-700 px-4 py-2 hover:bg-neutral-800"
        >
          <PlusCircle className="w-4 h-4" /> Manage Templates
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Stat icon={<FileArchive className="w-4 h-4" />} title="Exports (30d)" value="12" hint="+3 vs prev" />
        <Stat icon={<Activity className="w-4 h-4" />} title="Active Templates" value="3" hint="Owner / DD / Bank" />
        <Stat icon={<Shield className="w-4 h-4" />} title="Watermark/DRM" value="On" hint="PDF only" />
      </div>

      <Card title="Recent export jobs">
        <table className="w-full text-sm">
          <thead className="text-neutral-400">
            <tr>
              <th className="text-left py-2">Job ID</th>
              <th className="text-left py-2">Template</th>
              <th className="text-left py-2">Requested by</th>
              <th className="text-left py-2">Time</th>
              <th className="text-left py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((r) => (
              <tr key={r.id} className="border-t border-neutral-800">
                <td className="py-2">{r.id}</td>
                <td>{r.template}</td>
                <td>{r.by}</td>
                <td className="flex items-center gap-1"><Clock className="w-3 h-3" /> {r.at}</td>
                <td>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    r.status === "done" ? "bg-emerald-900/40 text-emerald-300" : "bg-amber-900/40 text-amber-300"
                  }`}>{r.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title="What can admins do here?">
        <ul className="list-disc list-inside text-neutral-300 space-y-1">
          <li>จัดการ <b>Templates</b> (Owner Binder, Due Diligence Lite, Bank Loan Pack ฯลฯ)</li>
          <li>กำหนด <b>watermark / redaction / retention</b> และสิทธิ์ดาวน์โหลด</li>
          <li>ดู <b>audit log</b>, โควต้า, และยกเลิก/ลบไฟล์ที่ผิดนโยบาย</li>
        </ul>
      </Card>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5">
      <div className="mb-3"><h2 className="text-base font-semibold">{title}</h2></div>
      {children}
    </div>
  );
}
function Stat({ icon, title, value, hint }: { icon: React.ReactNode; title: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4">
      <div className="text-neutral-400 text-sm flex items-center gap-2">{icon}{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      {hint && <div className="text-xs text-neutral-500 mt-1">{hint}</div>}
    </div>
  );
}
