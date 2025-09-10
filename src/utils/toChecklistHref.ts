// src/utils/toChecklistHref.ts
import type { CategoryKey } from '@/services/checklistService';

export function toChecklistHref(cat: CategoryKey, year?: number) {
  const pathname = `/checklist/${cat}`;
  return year ? { pathname, query: { year } } : pathname;
}
