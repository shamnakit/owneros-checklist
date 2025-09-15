// /src/pages/api/import/ar-aging-csv.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { parse } from 'csv-parse/sync';
import { upsertAging } from '@/connectors/persist';

export const config = { api: { bodyParser: false } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).end();
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    const csv = Buffer.concat(chunks).toString('utf8');
    const records = parse(csv, { columns: true, skip_empty_lines: true });

    const rows = records.map((r: any) => ({
      as_of_date: new Date(r.as_of_date).toISOString().slice(0,10),
      bucket: r.bucket as any,
      amount: Number(r.amount || 0)
    }));

    const orgId = String(req.headers['x-org-id'] || '');
    if (!orgId) return res.status(400).json({ error: 'missing x-org-id' });

    await upsertAging(orgId, 'fact_ar_aging', rows);
    res.json({ ok: true, count: rows.length });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'upload_failed' });
  }
}
