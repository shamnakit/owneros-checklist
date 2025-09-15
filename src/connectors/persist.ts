// src/connectors/persist.ts
import { createClient } from '@supabase/supabase-js';
import type { SalesDaily, AgingRow, NpsRow, HrEvent } from '@/connectors/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! // ใช้ฝั่ง server เท่านั้น (API routes)
);

export async function upsertSalesDaily(orgId: string, rows: SalesDaily[]) {
  if (!rows.length) return;
  const payload = rows.map(r => ({ org_id: orgId, ...r, channel: r.channel ?? 'n/a' }));
  await supabase.from('fact_sales_daily').upsert(payload, { onConflict: 'org_id,date,channel' });
}

export async function upsertAging(orgId: string, table: 'fact_ar_aging'|'fact_ap_aging', rows: AgingRow[]) {
  if (!rows.length) return;
  const payload = rows.map(r => ({ org_id: orgId, as_of_date: r.as_of_date, bucket: r.bucket, amount: r.amount }));
  await supabase.from(table).upsert(payload, { onConflict: 'org_id,as_of_date,bucket' });
}

export async function insertNps(orgId: string, rows: NpsRow[]) {
  if (!rows.length) return;
  await supabase.from('fact_nps').insert(rows.map(r => ({ org_id: orgId, ...r })));
}

export async function insertHrEvents(orgId: string, rows: HrEvent[]) {
  if (!rows.length) return;
  await supabase.from('fact_hr_events').insert(rows.map(r => ({ org_id: orgId, ...r })));
}
