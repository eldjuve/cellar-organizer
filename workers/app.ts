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
    if (request.headers.get("Upgrade") === "websocket") {
      const url = new URL(request.url);
      const session = await getSession(request.headers.get("Cookie"));
      const username = session.get("username");
      if (!username) {
        return new Response("Unauthorized", { status: 401 });
      }
      if (url.pathname === "/ws/bottles") {
        return env.WINE_STORE.getByName(username).fetch(request);
      }
      if (url.pathname === "/ws/setups") {
        return env.SETUP_STORE.getByName(username).fetch(request);
      }
      return new Response("Not Found", { status: 404 });
    }
    return requestHandler(request, {
      cloudflare: { env, ctx },
    });
  },
} satisfies ExportedHandler<Env>;
