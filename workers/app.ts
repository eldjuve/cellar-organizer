import { DurableObject } from "cloudflare:workers";
import { createRequestHandler } from "react-router";
import type { BottlePlacements } from "types";

declare module "react-router" {
  export interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
  }
}

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

export default {
  async fetch(request, env, ctx) {
    return requestHandler(request, {
      cloudflare: { env, ctx },
    });
  },
} satisfies ExportedHandler<Env>;

export class BottlePlacementStore extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    // Required, as we are extending the base class.
    super(ctx, env);
  }

  async placeBottle(iWine: string, positions: string) {
    this.ctx.storage.kv.put(iWine, positions);
  }

  async getInventory(): Promise<BottlePlacements> {
    const store = await this.ctx.storage.kv.list<string>();
    if (store) {
      const list = [...store];
      return list.reduce((acc, [key, val]) => {
        acc[key] = JSON.parse(val);
        return acc;
      }, {} as BottlePlacements);
    }
    return {};
  }

  async getStorage() {
    const store = await this.ctx.storage.list()
  }
}
