type BitrixWebhookCreds = { mode: "webhook"; baseUrl: string; userId: string; webhook: string };
type BitrixOAuthCreds   = { mode: "oauth";   baseUrl: string; accessToken: string };
export type BitrixCreds = BitrixWebhookCreds | BitrixOAuthCreds;

export class BitrixClient {
  constructor(private creds: BitrixCreds) {}
  private async fetchWithRetry(url: string, init?: RequestInit, tries = 3): Promise<any> {
    for (let i = 0; i < tries; i++) {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, ...init });
      if (res.status === 429) { await new Promise(r => setTimeout(r, 600)); continue; }
      const j = await res.json();
      if (j?.error) throw new Error(j.error_description || j.error);
      return j;
    }
    throw new Error("bitrix_rate_limited");
  }
  private buildUrl(method: string) {
    if (this.creds.mode === "webhook") {
      const { baseUrl, userId, webhook } = this.creds;
      return `${baseUrl}/rest/${userId}/${webhook}/${method}.json`;
    } else {
      const { baseUrl, accessToken } = this.creds;
      return `${baseUrl}/rest/${method}.json?auth=${encodeURIComponent(accessToken)}`;
    }
  }
  async call(method: string, params: Record<string, any> = {}) {
    let url = this.buildUrl(method);
    let start: number | undefined = 0;
    const out: any[] = [];
    while (true) {
      const body = JSON.stringify({ params: { ...params, start } });
      const j = await this.fetchWithRetry(url, { body });
      if (Array.isArray(j?.result)) out.push(...j.result);
      else if (Array.isArray(j?.result?.items)) out.push(...j.result.items);
      if (j?.next !== undefined && j.next !== null) { start = j.next; await new Promise(r => setTimeout(r, 350)); continue; }
      break;
    }
    return out;
  }
}
