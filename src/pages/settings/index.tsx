// src/pages/settings/index.tsx
import Link from "next/link";
import { Settings, User, Building2, Globe2 } from "lucide-react";

export default function SettingsHome() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="text-slate-700" />
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <p className="text-slate-600">
        ตั้งค่าระบบสำหรับบริษัทของคุณ (MVP v1: <b>Personal</b>, <b>Company</b>, <b>System</b>)
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/settings/personal"
          className="group rounded-xl border bg-white p-5 hover:border-blue-400 hover:shadow-sm transition"
        >
          <div className="flex items-center gap-3">
            <User className="text-slate-700" />
            <h2 className="font-semibold">Personal</h2>
          </div>
          <p className="text-sm text-slate-600 mt-2">
            ชื่อ–ตำแหน่ง รูปโปรไฟล์ ข้อมูลผู้กรอก
          </p>
          <div className="mt-3 text-blue-600 text-sm opacity-0 group-hover:opacity-100">
            จัดการ →
          </div>
        </Link>

        <Link
          href="/settings/company"
          className="group rounded-xl border bg-white p-5 hover:border-blue-400 hover:shadow-sm transition"
        >
          <div className="flex items-center gap-3">
            <Building2 className="text-slate-700" />
            <h2 className="font-semibold">Company</h2>
          </div>
          <p className="text-sm text-slate-600 mt-2">
            ชื่อบริษัท อุตสาหกรรม โลโก้ และช่วงยอดขาย (Revenue Band)
          </p>
          <div className="mt-3 text-blue-600 text-sm opacity-0 group-hover:opacity-100">
            จัดการ →
          </div>
        </Link>

        <Link
          href="/settings/system"
          className="group rounded-xl border bg-white p-5 hover:border-blue-400 hover:shadow-sm transition"
        >
          <div className="flex items-center gap-3">
            <Globe2 className="text-slate-700" />
            <h2 className="font-semibold">System</h2>
          </div>
          <p className="text-sm text-slate-600 mt-2">
            ภาษา รูปแบบวันที่/เวลา และค่าทั่วไปของระบบ
          </p>
          <div className="mt-3 text-blue-600 text-sm opacity-0 group-hover:opacity-100">
            จัดการ →
          </div>
        </Link>
      </div>
    </div>
  );
}
