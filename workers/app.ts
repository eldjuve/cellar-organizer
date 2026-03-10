import { createRequestHandler } from "react-router";
import { getSession } from "../app/sessions.server";

declare module "react-router" {
  export interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
  }
}

export { StorageSetupStore } from "./storage-setup-store";
export { WineInventoryStore } from "./wine-inventory-store";

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/sse/bottles") {
      const session = await getSession(request.headers.get("Cookie"));
      const username = session.get("username");
      if (!username) return new Response("Unauthorized", { status: 401 });
      return env.WINE_STORE.getByName(username).fetch(request);
    }
    if (url.pathname === "/sse/setups") {
      const session = await getSession(request.headers.get("Cookie"));
      const username = session.get("username");
      if (!username) return new Response("Unauthorized", { status: 401 });
      return env.SETUP_STORE.getByName(username).fetch(request);
    }
    return requestHandler(request, { cloudflare: { env, ctx } });
  },
} satisfies ExportedHandler<Env>;
