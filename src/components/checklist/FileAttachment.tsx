import React from "react";
import Link from "next/link";
import { getDisplayFileName } from "@/utils/getDisplayFileName";

type Props = {
  /** URL สาธารณะของไฟล์ (preferred) */
  fileUrl?: string | null;
  /** path/stored_name ใน Supabase (กรณีไม่มี URL) */
  filePathOrName?: string | null;
  /** ชื่อไฟล์ต้นฉบับจาก DB ถ้ามี จะใช้แสดงผลทันที */
  originalName?: string | null;
  onDelete?: () => void;
  onPreview?: () => void; // ถ้าต้องการทำ preview modal เอง
  className?: string;
};

export default function FileAttachment({
  fileUrl,
  filePathOrName,
  originalName,
  onDelete,
  onPreview,
  className,
}: Props) {
  const displayName =
    (originalName && originalName.trim()) ||
    getDisplayFileName(fileUrl || filePathOrName || "");

  if (!fileUrl && !filePathOrName) {
    return <span className={className}>— ไม่มีไฟล์แนบ —</span>;
  }

  return (
    <div className={`flex items-center gap-3 ${className || ""}`}>
      {/* ลิงก์ดูไฟล์ */}
      {fileUrl ? (
        <Link
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
          title={displayName}
        >
          {displayName || "ดูไฟล์แนบ"}
        </Link>
      ) : (
        <span className="text-blue-600" title={displayName}>
          {displayName}
        </span>
      )}

      {/* ปุ่มดูไฟล์ (ถ้าต้องการ preview modal เอง) */}
      {onPreview && (
        <button
          type="button"
          onClick={onPreview}
          className="text-sm px-2 py-1 rounded border hover:bg-gray-50"
        >
          ดูไฟล์แนบ
        </button>
      )}

      {/* ปุ่มลบไฟล์ */}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="text-sm text-red-600 hover:text-red-700"
        >
          ลบไฟล์
        </button>
      )}
    </div>
  );
}
