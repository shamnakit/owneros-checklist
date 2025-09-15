// /src/connectors/odoo/sales.ts
import { OdooClient } from './client';
import type { SalesDaily } from '@/connectors/types';


export async function pullSalesDailyOdoo(cli: OdooClient, from: string, to: string): Promise<SalesDaily[]> {
// อ่าน invoices ที่โพสต์แล้ว (customer invoice)
const domain = [
["move_type", "=", "out_invoice"],
["invoice_date", ">=", from],
["invoice_date", "<=", to],
["state", "=", "posted"]
];
const fields = ["invoice_date", "amount_total", "amount_untaxed"];
const records = await cli.call('account.move', 'search_read', [domain, fields]);


const byDate = new Map<string, { net: number; gross: number; orders: number }>();
for (const r of records) {
const d = r.invoice_date; // 'YYYY-MM-DD'
const acc = byDate.get(d) || { net: 0, gross: 0, orders: 0 };
acc.net += Number(r.amount_untaxed || 0);
acc.gross += Number(r.amount_total || 0);
acc.orders += 1;
byDate.set(d, acc);
}
return Array.from(byDate, ([date, v]) => ({ date, channel: 'odoo', net_amount: v.net, gross_amount: v.gross, orders: v.orders }));
}