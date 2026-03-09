import { DurableObject } from "cloudflare:workers";
import { createRequestHandler } from "react-router";
import type { BottlePlacement, BottlesClientMessage, BottlePlacements, InventoryMatrix, SetupsClientMessage, SetupListItem, StorageSetup, WineItem } from "types";
import { getSession } from "../app/sessions.server";

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

  deleteSetup(id: string): void {
    this.ctx.storage.sql.exec("DELETE FROM setups WHERE id = ?", id);
  }

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected WebSocket", { status: 426 });
    }
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair) as [WebSocket, WebSocket];
    this.ctx.acceptWebSocket(server);
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    let parsed: SetupsClientMessage;
    try {
      parsed = JSON.parse(typeof message === "string" ? message : new TextDecoder().decode(message));
    } catch {
      ws.send(JSON.stringify({ type: "error", message: "Invalid JSON" }));
      return;
    }
    switch (parsed.type) {
      case "getSetupList":
        ws.send(JSON.stringify({ type: "setupList", data: this.getSetupList() }));
        break;
      case "getSetup":
        ws.send(JSON.stringify({ type: "setup", data: this.getSetup(parsed.id) }));
        break;
      case "setSetup":
        ws.send(JSON.stringify({
          type: "savedSetup",
          id: this.setSetup(parsed.id, parsed.name, parsed.config),
        }));
        break;
      default:
        ws.send(JSON.stringify({ type: "error", message: `Unknown message type: ${(parsed as { type: unknown }).type}` }));
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string): Promise<void> {
    ws.close(code, reason);
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    ws.close(1011, "Internal error");
  }
}

export class WineInventoryStore extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS wines (
        iWine         TEXT PRIMARY KEY,
        wine          TEXT NOT NULL,
        producer      TEXT NOT NULL,
        type          TEXT,
        country       TEXT,
        quantity      INTEGER DEFAULT 0,
        wine_barcode  TEXT,
        upc           TEXT,
        data          TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_type         ON wines(type);
      CREATE INDEX IF NOT EXISTS idx_country      ON wines(country);
      CREATE INDEX IF NOT EXISTS idx_wine_barcode ON wines(wine_barcode);
      CREATE INDEX IF NOT EXISTS idx_upc          ON wines(upc);
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

  setInventory(wines: WineItem[]): void {
    this.ctx.storage.sql.exec("DELETE FROM wines");
    for (const w of wines) {
      this.ctx.storage.sql.exec(
        `INSERT INTO wines (iWine, wine, producer, type, country, quantity, wine_barcode, upc, data)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        w.iWine, w.Wine, w.Producer, w.Type ?? null, w.Country ?? null,
        Number(w.Quantity), w.WineBarcode || null, w.UPC || null, JSON.stringify(w),
      );
    }
  }

  getCount(): number {
    const rows = [...this.ctx.storage.sql.exec<{ n: number }>("SELECT COUNT(*) AS n FROM wines")];
    return rows[0].n;
  }

  queryInventory(q?: string, type?: string, country?: string, placement?: "all" | "active" | "pending", setupId?: string): WineItem[] {
    let sql = `SELECT w.data, json_group_array(
      CASE WHEN p.setup_id IS NULL THEN NULL
      ELSE json_object('setupId', p.setup_id, 'shelf', p.shelf, 'layer', p.layer, 'slot', p.slot)
      END
    ) AS placements_json
    FROM wines w
    LEFT JOIN placements p ON w.iWine = p.iWine
    WHERE 1=1`;
    const params: unknown[] = [];
    if (type)    { sql += " AND w.type = ?";                                   params.push(type); }
    if (country) { sql += " AND w.country = ?";                                params.push(country); }
    if (q)       { sql += " AND (w.wine LIKE ? OR w.producer LIKE ?)";         params.push(`%${q}%`, `%${q}%`); }
    if (placement === "active" && setupId) {
      sql += " AND EXISTS (SELECT 1 FROM placements p2 WHERE p2.iWine = w.iWine AND p2.setup_id = ?)";
      params.push(setupId);
    }
    if (placement === "pending") {
      sql += " AND (SELECT COUNT(*) FROM placements p2 WHERE p2.iWine = w.iWine) < w.quantity";
    }
    sql += " GROUP BY w.iWine";
    return [...this.ctx.storage.sql.exec<{ data: string; placements_json: string }>(sql, ...params)]
      .map((r) => {
        const wine: WineItem = JSON.parse(r.data);
        const rawPlacements: (BottlePlacement | null)[] = JSON.parse(r.placements_json);
        const placements = rawPlacements.filter((p): p is BottlePlacement => p !== null);
        if (placements.length > 0) wine.placements = placements;
        return wine;
      });
  }

  getWineById(iWine: string): WineItem | null {
    const rows = [...this.ctx.storage.sql.exec<{ data: string; placements_json: string }>(
      `SELECT w.data, json_group_array(
      CASE WHEN p.setup_id IS NULL THEN NULL
      ELSE json_object('setupId', p.setup_id, 'shelf', p.shelf, 'layer', p.layer, 'slot', p.slot)
      END
    ) AS placements_json
    FROM wines w
    LEFT JOIN placements p ON w.iWine = p.iWine
    WHERE w.iWine = ?
    GROUP BY w.iWine`,
      iWine,
    )];
    if (!rows.length) return null;
    const wine: WineItem = JSON.parse(rows[0].data);
    const rawPlacements: (BottlePlacement | null)[] = JSON.parse(rows[0].placements_json);
    const placements = rawPlacements.filter((p): p is BottlePlacement => p !== null);
    if (placements.length > 0) wine.placements = placements;
    return wine;
  }

  lookupBarcode(barcode: string): WineItem | null {
    const rows = [...this.ctx.storage.sql.exec<{ data: string }>(
      "SELECT data FROM wines WHERE wine_barcode = ? OR upc = ? LIMIT 1",
      barcode, barcode,
    )];
    return rows.length ? JSON.parse(rows[0].data) : null;
  }

  getFilterOptions(): { types: string[]; countries: string[] } {
    const types = [...this.ctx.storage.sql.exec<{ type: string }>(
      "SELECT DISTINCT type FROM wines WHERE type IS NOT NULL ORDER BY type",
    )].map((r) => r.type);
    const countries = [...this.ctx.storage.sql.exec<{ country: string }>(
      "SELECT DISTINCT country FROM wines WHERE country IS NOT NULL ORDER BY country",
    )].map((r) => r.country);
    return { types, countries };
  }

  addPlacement(iWine: string, setupId: string, shelf: number, layer: number, slot: number) {
    this.ctx.storage.sql.exec(
      "INSERT OR IGNORE INTO placements (iWine, setup_id, shelf, layer, slot) VALUES (?, ?, ?, ?, ?)",
      iWine, setupId, shelf, layer, slot,
    );
  }

  removePlacement(iWine: string, setupId: string, shelf: number, layer: number, slot: number) {
    this.ctx.storage.sql.exec(
      "DELETE FROM placements WHERE iWine = ? AND setup_id = ? AND shelf = ? AND layer = ? AND slot = ?",
      iWine, setupId, shelf, layer, slot,
    );
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

  getWinesInSetup(setupId: string): InventoryMatrix {
    type Row = { data: string; shelf: number; layer: number; slot: number };
    const rows = [...this.ctx.storage.sql.exec<Row>(
      `SELECT w.data, p.shelf, p.layer, p.slot FROM wines w
       JOIN placements p ON w.iWine = p.iWine
       WHERE p.setup_id = ?`,
      setupId,
    )];
    const matrix: InventoryMatrix = {};
    for (const { data, shelf, layer, slot } of rows) {
      matrix[shelf] ??= {};
      matrix[shelf][layer] ??= {};
      matrix[shelf][layer][slot] = JSON.parse(data);
    }
    return matrix;
  }

  private broadcast(sender: WebSocket, message: string) {
    for (const ws of this.ctx.getWebSockets()) {
      if (ws !== sender) ws.send(message);
    }
  }

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected WebSocket", { status: 426 });
    }
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair) as [WebSocket, WebSocket];
    this.ctx.acceptWebSocket(server);
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    let parsed: BottlesClientMessage;
    try {
      parsed = JSON.parse(typeof message === "string" ? message : new TextDecoder().decode(message));
    } catch {
      ws.send(JSON.stringify({ type: "error", message: "Invalid JSON" }));
      return;
    }
    switch (parsed.type) {
      case "getInventory":
        ws.send(JSON.stringify({ type: "inventory", data: this.getInventory() }));
        break;
      case "addPlacement":
        this.addPlacement(parsed.iWine, parsed.setupId, parsed.shelf, parsed.layer, parsed.slot);
        this.broadcast(ws, JSON.stringify({ type: "placementAdded", iWine: parsed.iWine, setupId: parsed.setupId, shelf: parsed.shelf, layer: parsed.layer, slot: parsed.slot }));
        ws.send(JSON.stringify({ type: "ack" }));
        break;
      case "removePlacement":
        this.removePlacement(parsed.iWine, parsed.setupId, parsed.shelf, parsed.layer, parsed.slot);
        this.broadcast(ws, JSON.stringify({ type: "placementRemoved", iWine: parsed.iWine, setupId: parsed.setupId, shelf: parsed.shelf, layer: parsed.layer, slot: parsed.slot }));
        ws.send(JSON.stringify({ type: "ack" }));
        break;
      default:
        ws.send(JSON.stringify({ type: "error", message: `Unknown message type: ${(parsed as { type: unknown }).type}` }));
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string): Promise<void> {
    ws.close(code, reason);
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    ws.close(1011, "Internal error");
  }
}
