// /src/connectors/shopify/index.ts (skeleton)
export class ShopifyClient { constructor(private creds:{ shop:string; token:string }){}
async orders(from:string,to:string){ /* GET /orders.json with status=paid */ return [] }
}