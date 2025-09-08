// ================================================
// File: src/types/checklist.ts
// ================================================

/** กลุ่มหมวดหลักในระบบ */
export type GroupKey =
  | "strategy"
  | "structure"
  | "sop"
  | "hr"
  | "finance"
  | "sales";

/** สเกลความสุกงอมของรายการ (ใช้กับการคำนวณคะแนน) */
export type Maturity = 0 | 1 | 2; // 0=ไม่มี, 1=บางส่วน, 2=ครบใช้งานจริง

/** ระดับชั้นขององค์กร (สรุปผลรวมตามเกณฑ์คะแนน) */
export type Tier = "Excellent" | "Developing" | "Early";

/**
 * รายการเช็กลิสต์ 1 ข้อ
 * - ใช้ร่วมทั้งฝั่ง UI และแมปกับตาราง/วิวจาก Supabase
 * - รวมทุกฟิลด์ที่เคยใช้งานไว้ใน type เดียว เพื่อหลีกเลี่ยง Duplicate identifier
 */
export type ChecklistItem = {
  id: string;

  /** อ้างอิงแม่แบบ (ถ้ามี) */
  template_id?: string | null;

  /** หมวดหลักของรายการ */
  group: GroupKey;

  /** ลำดับในหมวด (สำหรับเรียงใน UI/รายงาน) */
  index_number?: number | null;

  /** ชื่อรายการ */
  name: string;

  /** คำแนะนำวิธีทำ/นิยาม (ใหม่) */
  guideline?: string | null;

  /** ตัวอย่างหลักฐาน/เอกสารอ้างอิง (ใหม่) */
  example?: string | null;

  /** ช่องกรอกหมายเหตุ/รายละเอียดเพิ่มเติม โดยผู้ใช้ */
  input_text?: string | null;

  /** ผู้ใช้ติ๊กทำแล้วหรือยัง (progress) */
  has_record?: boolean;

  /** มีไฟล์/ลิงก์หลักฐานแนบครบหรือยัง */
  has_evidence?: boolean;

  /** ระดับความสุกงอม 0/1/2 (ใช้ถ่วงน้ำหนักคะแนน) */
  maturity?: Maturity;

  /** พาธไฟล์ในสตอเรจ (ถ้ามี) */
  file_path?: string | null;

  /** คีย์ไฟล์ในสตอเรจ (ถ้ามี) */
  file_key?: string | null;

  /** เวลาอัปเดตล่าสุด (ISO string) */
  updated_at?: string | null;

  /** เวอร์ชันปีของชุดเช็กลิสต์ */
  year_version: number;
};

/** สรุปภาพรวมรายหมวดสำหรับแดชบอร์ด */
export type GroupOverview = {
  group: GroupKey;
  title: string;

  /** %Progress = จำนวนข้อที่ “ทำแล้ว”/ทั้งหมด × 100 (เชิงปริมาณ) */
  percentComplete: number;

  /** Score% = คะแนนถ่วงน้ำหนัก/คะแนนเต็ม × 100 (ใช้ตัดเกรด) */
  scorePercent?: number;

  /** จำนวนไฟล์ที่พร้อม/ยังขาด (ถ้าคำนวนไว้) */
  filesReady?: number;
  filesMissing?: number;

  /** Tier สรุปของหมวด (ไม่ใส่ก็ได้ ใช้เฉพาะจอที่ต้องการ) */
  tier?: Tier;
};

/** สรุปภาพรวมทั้งองค์กรสำหรับแดชบอร์ด */
export type OverviewResponse = {
  /** %Progress รวมทุกหมวด (ถ่วงตามจำนวนข้อ) */
  totalPercent: number;

  /** Score% รวม (ถ่วงตามคะแนน) — ใช้ตัดเกรดหลัก */
  totalScorePercent?: number;

  /** Tier สรุปรวม */
  tier?: Tier;

  /** รายการภาพรวมรายหมวด */
  groups: GroupOverview[];
};
