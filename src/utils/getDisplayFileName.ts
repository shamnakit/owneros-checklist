// src/utils/getDisplayFileName.ts
export function getDisplayFileName(input: string): string {
  if (!input) return "";

  // 1) เอาเฉพาะชื่อไฟล์ท้ายสุด และตัด query string
  const lastSegment = input.split("?")[0].split("/").pop() || "";

  // 2) decode เผื่อมี %20 หรืออักขระพิเศษ
  const decoded = decodeURIComponent(lastSegment);

  // 3) ตัดรูปแบบ "{uuid}-{timestamp}-" ถ้ามี
  const withUuid = decoded.replace(/^[0-9a-fA-F-]{36}-\d{10,13}-/, "");
  if (withUuid !== decoded) return withUuid;

  // 4) fallback: ตัด "{อะไรก็ได้}-{อะไรก็ได้}-" 1 ชุดแรก
  return decoded.replace(/^[^-]+-[^-]+-/, "");
}
