import { DurableObject } from "cloudflare:workers";
import { createRequestHandler } from "react-router";
import type {
  BottlePlacements,
  StorageSetup,
  StorageSetupOverview,
} from "types";

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

  async placeBottle(iWine: string, position: string) {
    this.ctx.storage.kv.put(iWine, position);
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
}

export class StorageSetupStore extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    // Required, as we are extending the base class.
    super(ctx, env);
  }

  async setSetup(name: string, setup: StorageSetup) {
    this.ctx.storage.put(name, setup);
  }

  async getSetup(key: string): Promise<StorageSetup | null> {
    const store = await this.ctx.storage.get(key);
    if (store) {
      return store as StorageSetup;
    }
    return null;
  }

  async getSetupList(): Promise<string[]> {
    const store = await this.ctx.storage.list<StorageSetup>();
    if (store) {
      return [...store.keys()];
    }
    return [];
  }
}
