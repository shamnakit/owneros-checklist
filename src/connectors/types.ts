// src/connectors/types.ts

export type SalesDaily = { date: string; channel?: string; net_amount: number; gross_amount: number; orders: number };
export type AgingRow = { as_of_date: string; bucket: '0-30'|'31-60'|'61-90'|'90+'; amount: number };
export type NpsRow = { date: string; respondent_id?: string; score: number; comment?: string };
export type HrEvent = { date: string; employee_id: string; action: 'hire'|'exit'; department?: string };

export type ConnectorContext = { orgId: string; sourceId: string; creds: any };

export interface SalesConnector { pullSalesDaily(ctx: ConnectorContext, from: string, to: string): Promise<SalesDaily[]>; }
export interface ARAgingConnector { pullARAging(ctx: ConnectorContext, asOf: string): Promise<AgingRow[]>; }
export interface APAgingConnector { pullAPAging(ctx: ConnectorContext, asOf: string): Promise<AgingRow[]>; }
export interface NpsConnector { pullNps(ctx: ConnectorContext, from: string, to: string): Promise<NpsRow[]>; }
export interface HrConnector { pullHrEvents(ctx: ConnectorContext, from: string, to: string): Promise<HrEvent[]>; }
