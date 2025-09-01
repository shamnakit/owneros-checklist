// ================================================
// File: src/constants/checklist.ts
// ================================================
import type { GroupKey } from "../types/checklist";


export const GROUPS: { key: GroupKey; title: string; slug: string }[] = [
{ key: "strategy", title: "กลยุทธ์องค์กร", slug: "strategy" },
{ key: "structure", title: "โครงสร้างองค์กร", slug: "structure" },
{ key: "sop", title: "คู่มือปฏิบัติงาน", slug: "sop" },
{ key: "hr", title: "ระบบบุคคล & HR", slug: "hr" },
{ key: "finance", title: "ระบบการเงิน", slug: "finance" },
{ key: "sales", title: "ระบบลูกค้า/ขาย", slug: "sales" },
];


export const GROUP_TITLES: Record<GroupKey, string> = GROUPS.reduce(
(acc, g) => ((acc[g.key] = g.title), acc),
{} as Record<GroupKey, string>
);