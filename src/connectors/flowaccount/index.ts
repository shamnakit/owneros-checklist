// src/connectors/flowaccount/index.ts
import type { SalesDaily, AgingRow } from "@/connectors/types";

// โครง client (skeleton) — เอาไว้ต่อ REST ของ FlowAccount
export class FlowAccountClient {
  constructor(private creds: { apiKey: string; companyId: string }) {}
  async getInvoices(from: string, to: string) {
    // TODO: call REST -> คืนรายการใบกำกับ/ใบเสร็จ
    return [] as Array<{
      issue_date: string;   // 'YYYY-MM-DD'
      amount_net: number;
      amount_gross: number;
    }>;
  }
}

// แปลงเป็น canonical: SalesDaily (สรุปเป็นรายวัน)
export async function pullSalesDailyFlow(
  cli: FlowAccountClient,
  from: string,
  to: string
): Promise<SalesDaily[]> {
  const invs = await cli.getInvoices(from, to);
  const map = new Map<string, { net: number; gross: number; orders: number }>();
  for (const i of invs) {
    const d = i.issue_date;
    const acc = map.get(d) || { net: 0, gross: 0, orders: 0 };
    acc.net += Number(i.amount_net || 0);
    acc.gross += Number(i.amount_gross || 0);
    acc.orders += 1;
    map.set(d, acc);
  }
  return Array.from(map, ([date, v]) => ({
    date,
    channel: "flowaccount",
    net_amount: v.net,
    gross_amount: v.gross,
    orders: v.orders,
  }));
}

// ตัวอย่าง AR Aging (โครง)
export async function pullAraAgingFlow(
  _cli: FlowAccountClient,
  asOf: string
): Promise<AgingRow[]> {
  // TODO: คำนวณ bucket จาก due_date/residual
  return [
    { as_of_date: asOf, bucket: "0-30", amount: 0 },
    { as_of_date: asOf, bucket: "31-60", amount: 0 },
    { as_of_date: asOf, bucket: "61-90", amount: 0 },
    { as_of_date: asOf, bucket: "90+", amount: 0 },
  ];
}
