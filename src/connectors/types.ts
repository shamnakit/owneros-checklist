// src/connectors/types.ts

// ===== Canonical Row Types (ใช้ร่วมทุกตัวเชื่อม) =====
export type SalesDaily = {
  date: string;                // 'YYYY-MM-DD'
  channel?: string;            // 'sheets' | 'odoo' | 'shopify' | ...
  net_amount: number;
  gross_amount: number;
  orders: number;
};

export type AgingRow = {
  as_of_date: string;          // 'YYYY-MM-DD'
  bucket: '0-30' | '31-60' | '61-90' | '90+';
  amount: number;
};

export type NpsRow = {
  date: string;                // 'YYYY-MM-DD'
  respondent_id?: string;
  score: number;               // 0..10
  comment?: string;
};

export type HrEvent = {
  date: string;                // 'YYYY-MM-DD'
  employee_id: string;
  action: 'hire' | 'exit';
  department?: string;
};

// ===== Connector Context (credential/รหัสองค์กร) =====
export type ConnectorContext = {
  orgId: string;
  sourceId: string;
  creds: any;
};

// ===== Interface ของตัวเชื่อม (สัญญามาตรฐาน) =====
export interface SalesConnector {
  pullSalesDaily(ctx: ConnectorContext, from: string, to: string): Promise<SalesDaily[]>;
}
export interface ARAgingConnector {
  pullARAging(ctx: ConnectorContext, asOf: string): Promise<AgingRow[]>;
}
export interface APAgingConnector {
  pullAPAging(ctx: ConnectorContext, asOf: string): Promise<AgingRow[]>;
}
export interface NpsConnector {
  pullNps(ctx: ConnectorContext, from: string, to: string): Promise<NpsRow[]>;
}
export interface HrConnector {
  pullHrEvents(ctx: ConnectorContext, from: string, to: string): Promise<HrEvent[]>;
}
