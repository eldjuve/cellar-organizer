import { DurableObject } from "cloudflare:workers";
import { createRequestHandler } from "react-router";
import type { BottlePlacement, BottlePlacements, SetupListItem, StorageSetup } from "types";

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
    super(ctx, env);
    ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS placements (
        iWine    TEXT    NOT NULL,
        setup_id TEXT    NOT NULL,
        shelf    INTEGER NOT NULL,
        layer    INTEGER NOT NULL,
        slot     INTEGER NOT NULL,
        PRIMARY KEY (setup_id, shelf, layer, slot)
      )
    `);
  }

  placeBottle(iWine: string, placements: string) {
    const items = JSON.parse(placements) as BottlePlacement[];
    this.ctx.storage.sql.exec("DELETE FROM placements WHERE iWine = ?", iWine);
    for (const { setupId, shelf, layer, slot } of items) {
      this.ctx.storage.sql.exec(
        "INSERT INTO placements (iWine, setup_id, shelf, layer, slot) VALUES (?, ?, ?, ?, ?)",
        iWine, setupId, shelf, layer, slot,
      );
    }
  }

  getInventory(): BottlePlacements {
    type Row = { iWine: string; setup_id: string; shelf: number; layer: number; slot: number };
    const rows = [...this.ctx.storage.sql.exec<Row>(
      "SELECT iWine, setup_id, shelf, layer, slot FROM placements",
    )];
    return rows.reduce((acc, { iWine, setup_id, shelf, layer, slot }) => {
      (acc[iWine] ??= []).push({ setupId: setup_id, shelf, layer, slot });
      return acc;
    }, {} as BottlePlacements);
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
