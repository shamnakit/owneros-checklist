import type { SalesDaily } from "@/connectors/types";
import { BitrixClient, BitrixCreds } from "./client";

export async function pullDealsWonDaily(creds: BitrixCreds, from: string, to: string): Promise<SalesDaily[]> {
  const cli = new BitrixClient(creds);

  // ใช้ stage semantic (S = success) + close date ช่วงที่กำหนด
  const params = {
    filter: {
      "STAGE_SEMANTIC_ID": "S",
      ">=CLOSEDATE": from,
      "<=CLOSEDATE": to,
    },
    select: ["ID", "TITLE", "OPPORTUNITY", "CURRENCY_ID", "CLOSEDATE"],
    order: { CLOSEDATE: "ASC" }
  };

  const deals = await cli.call("crm.deal.list", params);

  // รวมรายวัน
  const byDate = new Map<string, { net: number; gross: number; orders: number }>();
  for (const d of deals) {
    const date = (d.CLOSEDATE || "").slice(0, 10); // 'YYYY-MM-DD'
    const amt = Number(d.OPPORTUNITY || 0);
    const acc = byDate.get(date) || { net: 0, gross: 0, orders: 0 };
    acc.net += amt;
    acc.gross += amt; // ไม่มีภาษีในดีล => ใช้ amt เดียวกัน
    acc.orders += 1;
    byDate.set(date, acc);
  }

  return Array.from(byDate, ([date, v]) => ({
    date,
    channel: "bitrix",
    net_amount: v.net,
    gross_amount: v.gross,
    orders: v.orders,
  }));
}
