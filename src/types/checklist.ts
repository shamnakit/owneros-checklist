// ================================================
// File: src/types/checklist.ts
// ================================================
export type GroupKey =
| "strategy"
| "structure"
| "sop"
| "hr"
| "finance"
| "sales";


export type Maturity = 0 | 1 | 2; // 0=ไม่มี, 1=บางส่วน, 2=ครบใช้งานจริง


export type ChecklistItem = {
id: string;
template_id?: string | null;
group: GroupKey;
index_number?: number | null;
name: string;
input_text?: string | null;
has_record?: boolean; // ติ๊กแล้ว
has_evidence?: boolean; // มีไฟล์
maturity?: Maturity; // 0/1/2
file_path?: string | null;
file_key?: string | null;
updated_at?: string | null;
year_version: number;
};


export type GroupOverview = {
group: GroupKey;
title: string;
percentComplete: number; // %Progress
scorePercent?: number; // Score%
filesReady?: number;
filesMissing?: number;
tier?: "Excellent" | "Developing" | "Early";
};


export type OverviewResponse = {
totalPercent: number;
totalScorePercent?: number;
tier?: "Excellent" | "Developing" | "Early";
groups: GroupOverview[];
};