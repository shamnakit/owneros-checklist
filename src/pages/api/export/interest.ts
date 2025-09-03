// src/pages/api/interest.ts
import type { NextApiRequest, NextApiResponse } from 'next';


/**
* Collect interest leads (Pro/Premium) → store in Supabase if env is present,
* otherwise log and return 200. You can swap to Google Sheets easily.
*/
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
const { plan, name, email, phone, company } = req.body || {};
if (!plan || !name || !email) return res.status(400).json({ error: 'Missing fields' });


const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE; // server-side only


try {
if (url && key) {
// lightweight fetch-based insert (no client lib required)
const r = await fetch(`${url}/rest/v1/pricing_interest`, {
method: 'POST',
headers: {
'Content-Type': 'application/json',
'apikey': key,
'Authorization': `Bearer ${key}`,
'Prefer': 'return=representation',
},
body: JSON.stringify({ plan, name, email, phone, company, ts: new Date().toISOString() })
});
if (!r.ok) {
const text = await r.text();
console.error('Supabase insert failed:', text);
}
} else {
console.log('Lead (no DB configured):', { plan, name, email, phone, company });
}
} catch (e) {
console.error('interest API error', e);
}
return res.status(200).json({ ok: true });
}