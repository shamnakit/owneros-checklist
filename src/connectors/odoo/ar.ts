// /src/connectors/odoo/ar.ts
import { OdooClient } from './client';
import type { SalesDaily, AgingRow } from '@/connectors/types';


export async function pullAragingOdoo(cli: OdooClient, asOf: string): Promise<AgingRow[]> {
// ใบแจ้งหนี้คงค้าง (posted, not paid)
const domain = [
["move_type", "=", "out_invoice"],
["state", "=", "posted"],
["payment_state", "!=", "paid"],
["invoice_date", "<=", asOf]
];
const fields = ["invoice_date", "amount_residual"];
const recs = await cli.call('account.move', 'search_read', [domain, fields]);


const buckets = { '0-30':0, '31-60':0, '61-90':0, '90+':0 } as Record<string, number>;
const base = new Date(asOf).getTime();
for (const r of recs) {
const days = Math.floor((base - new Date(r.invoice_date).getTime()) / 86400000);
const amt = Number(r.amount_residual || 0);
if (days <= 30) buckets['0-30'] += amt; else if (days<=60) buckets['31-60'] += amt; else if (days<=90) buckets['61-90'] += amt; else buckets['90+'] += amt;
}
return Object.entries(buckets).map(([bucket, amount]) => ({ as_of_date: asOf, bucket: bucket as any, amount }));
}