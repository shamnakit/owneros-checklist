// /src/pages/api/import/sales-csv.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { parse } from 'csv-parse/sync';
import { upsertSalesDaily } from '@/connectors/persist';


export const config = { api: { bodyParser: false } };


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
try {
if (req.method !== 'POST') return res.status(405).end();
const chunks: Buffer[] = [];
for await (const chunk of req) chunks.push(chunk as Buffer);
const csv = Buffer.concat(chunks).toString('utf8');


const records = parse(csv, { columns: true, skip_empty_lines: true });
// expected columns: date, channel, net_amount, gross_amount, orders
const rows = records.map((r: any) => ({
date: new Date(r.date).toISOString().slice(0,10),
channel: r.channel || 'sheets',
net_amount: Number(r.net_amount||0),
gross_amount: Number(r.gross_amount||0),
orders: Number(r.orders||0)
}));


const orgId = String(req.headers['x-org-id']);
if (!orgId) return res.status(400).json({ error: 'missing x-org-id' });
await upsertSalesDaily(orgId, rows);
res.json({ ok: true, count: rows.length });
} catch (e:any) {
res.status(500).json({ error: e?.message || 'upload_failed' });
}
}