import React from "react";
import Link from "next/link";
import { useUserProfile } from "@/hooks/useUserProfile";
import Image from "next/image";

export default function DashboardPage() {
  const { profile, loading } = useUserProfile();

  if (loading || !profile) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">กำลังโหลดข้อมูล...</div>;
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">👋 ยินดีต้อนรับ, {profile.full_name || "เจ้าของกิจการ"}</h1>
        <p className="text-gray-500 mt-1">บริษัท: {profile.company_name || "ชื่อบริษัทของคุณ"}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* สรุปความคืบหน้า */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">📊 ความคืบหน้าระบบทั้งหมด</h2>
          <p className="text-gray-600 mb-2">ระบบกลยุทธ์องค์กร: 60%</p>
          <p className="text-gray-600 mb-2">ระบบบุคคล & HR: 40%</p>
          <p className="text-gray-600 mb-2">ระบบการเงิน: 20%</p>
        </div>

        {/* รายการเร่งด่วน */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">⚠ รายการที่ยังไม่ทำ</h2>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-2">
            <li>ยังไม่ได้กำหนด Vision</li>
            <li>ยังไม่มี Job Description สำหรับฝ่ายขาย</li>
            <li>ยังไม่ได้แนบโครงสร้างองค์กร</li>
          </ul>
        </div>

        {/* ลิงก์ลัด */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">🚀 ลิงก์ด่วน</h2>
          <div className="space-y-3">
            <Link href="/checklist">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded">ดู Checklist</button>
            </Link>
            <Link href="/checklist/profile">
              <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded">แก้ไขโปรไฟล์</button>
            </Link>
            <Link href="/checklist/settings">
              <button className="w-full bg-gray-700 hover:bg-gray-800 text-white py-2 px-4 rounded">ตั้งค่าระบบ</button>
            </Link>
            <Link href="/checklist/summary">
              <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded">สรุป & Export</button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
