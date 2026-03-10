// Lazy singleton: crypto.randomUUID() is disallowed in Cloudflare Workers global scope,
// so we defer generation to the first call (which happens inside a request handler).
// ??= ensures the same UUID is returned on every subsequent call.
let _clientId: string | undefined;
export const clientId = (): string => (_clientId ??= crypto.randomUUID());
