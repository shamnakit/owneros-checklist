// scripts/scheduler.ts
import cron from 'node-cron';

cron.schedule('*/30 * * * *', async () => {
  await fetch(process.env.BASE_URL + '/api/sync/odoo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-org-id': process.env.ORG_ID!
    },
    body: JSON.stringify({
      baseUrl: process.env.ODOO_URL,
      db: process.env.ODOO_DB,
      username: process.env.ODOO_USER,
      password: process.env.ODOO_PASS,
      from: '2025-01-01',
      to: '2025-12-31',
      asOf: new Date().toISOString().slice(0,10)
    })
  });
});
