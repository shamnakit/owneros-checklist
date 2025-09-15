// /src/connectors/odoo/client.ts
export class OdooClient {
constructor(private baseUrl: string, private db: string, private username: string, private password: string) {}
private uid: number | null = null;


private async rpc(path: string, body: any) {
const res = await fetch(`${this.baseUrl}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const j = await res.json();
if (j.error) throw new Error(j.error.data?.message || 'odoo_error');
return j.result;
}
async login() {
const r = await this.rpc('/web/session/authenticate', { params: { db: this.db, login: this.username, password: this.password } });
this.uid = r.uid; return this.uid;
}
async call(model: string, method: string, args: any[] = [], kwargs: any = {}) {
if (!this.uid) await this.login();
return this.rpc('/jsonrpc', { jsonrpc: '2.0', method: 'call', params: { model, method, args, kwargs }, id: Date.now() });
}
}