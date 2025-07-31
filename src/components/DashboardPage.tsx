import React from "react";
import Link from "next/link";
import { useUserProfile } from "@/hooks/useUserProfile";
import Image from "next/image";
import ScoreRadarChart from "@/components/charts/ScoreRadarChart";
import { useRadarScore } from "@/hooks/useRadarScore";

export default function DashboardPage() {
  const { profile, loading } = useUserProfile();
  const { data: radarData, loading: radarLoading } = useRadarScore(profile?.user_id); // ✅ ถูกต้อง

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
        {/* ความคืบหน้า */}
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

        {/* Radar Chart */}
        <div className="bg-white p-6 rounded-xl shadow col-span-1 md:col-span-2 lg:col-span-3">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">📈 ภาพรวมความพร้อมแยกตามระบบ</h2>
          {radarLoading ? (
            <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
          ) : (
            <ScoreRadarChart data={radarData} />
          )}
        </div>
      </div>
    </div>
  );
}
