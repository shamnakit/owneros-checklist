// /src/connectors/woocommerce/index.ts (skeleton)
export class WooClient { constructor(private creds:{ baseUrl:string; key:string; secret:string }){}
async orders(from:string,to:string){ /* GET /wp-json/wc/v3/orders */ return [] }
}