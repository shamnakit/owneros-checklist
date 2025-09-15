// /src/pages/api/sync/odoo.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { OdooClient } from '@/connectors/odoo/client';
import { pullSalesDailyOdoo } from '@/connectors/odoo/sales';
import { pullAragingOdoo } from '@/connectors/odoo/ar';
import { upsertSalesDaily, upsertAging } from '@/connectors/persist';


export default async function handler(req: NextApiRequest, res: NextApiResponse){
try{
const { baseUrl, db, username, password, from, to, asOf } = req.body;
const orgId = String(req.headers['x-org-id']);
const cli = new OdooClient(baseUrl, db, username, password);
const sales = await pullSalesDailyOdoo(cli, from, to);
await upsertSalesDaily(orgId, sales);
if (asOf){
const aging = await pullAragingOdoo(cli, asOf);
await upsertAging(orgId, 'fact_ar_aging', aging);
}
res.json({ ok:true, sales: sales.length });
}catch(e:any){
res.status(500).json({ error: e?.message || 'odoo_sync_failed' });
}
}