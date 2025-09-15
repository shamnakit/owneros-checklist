// src/connectors/persist.ts

import type { SalesDaily, AgingRow, NpsRow, HrEvent } from '@/connectors/types';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function upsertSalesDaily(orgId: string, rows: SalesDaily[]) {
  if (!rows.length) return;
  const payload = rows.map(r => ({ org_id: orgId, ...r, channel: r.channel ?? 'n/a' }));
  const { error } = await supabaseAdmin.from('fact_sales_daily').upsert(payload, { onConflict: 'org_id,date,channel' });
  if (error) throw error;
}
export async function upsertAging(orgId: string, table: 'fact_ar_aging'|'fact_ap_aging', rows: AgingRow[]) {
  if (!rows.length) return;
  const payload = rows.map(r => ({ org_id: orgId, as_of_date: r.as_of_date, bucket: r.bucket, amount: r.amount }));
  const { error } = await supabaseAdmin.from(table).upsert(payload, { onConflict: 'org_id,as_of_date,bucket' });
  if (error) throw error;
}
export async function insertNps(orgId: string, rows: NpsRow[]) {
  if (!rows.length) return;
  const { error } = await supabaseAdmin.from('fact_nps').insert(rows.map(r => ({ org_id: orgId, ...r })));
  if (error) throw error;
}
export async function insertHrEvents(orgId: string, rows: HrEvent[]) {
  if (!rows.length) return;
  const { error } = await supabaseAdmin.from('fact_hr_events').insert(rows.map(r => ({ org_id: orgId, ...r })));
  if (error) throw error;
}
