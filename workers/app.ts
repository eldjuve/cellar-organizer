import { DurableObject } from "cloudflare:workers";
import { createRequestHandler } from "react-router";
import type { BottlePlacements, SetupListItem, StorageSetup } from "types";

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
    super(ctx, env);
    ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS setups (
        id   TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        config TEXT NOT NULL
      )
    `);
  }

  setSetup(id: string | null, name: string, setup: StorageSetup): string {
    if (id) {
      this.ctx.storage.sql.exec(
        "UPDATE setups SET name = ?, config = ? WHERE id = ?",
        name, JSON.stringify(setup), id,
      );
      return id;
    } else {
      const newId = crypto.randomUUID();
      this.ctx.storage.sql.exec(
        "INSERT INTO setups (id, name, config) VALUES (?, ?, ?)",
        newId, name, JSON.stringify(setup),
      );
      return newId;
    }
  }

  getSetup(id: string): { name: string; config: StorageSetup } | null {
    const rows = [
      ...this.ctx.storage.sql.exec<{ name: string; config: string }>(
        "SELECT name, config FROM setups WHERE id = ?",
        id,
      ),
    ];
    return rows.length
      ? { name: rows[0].name, config: JSON.parse(rows[0].config) }
      : null;
  }

  getSetupList(): SetupListItem[] {
    return [
      ...this.ctx.storage.sql.exec<SetupListItem>(
        "SELECT id, name FROM setups ORDER BY name",
      ),
    ];
  }
}
