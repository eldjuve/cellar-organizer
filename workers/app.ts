import { DurableObject } from "cloudflare:workers";
import { createRequestHandler } from "react-router";
import type { BottlePlacements, SetupListItem, StorageSetup } from "types";
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
        return env.BOTTLE_STORE.getByName(username).fetch(request);
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
    let parsed: Record<string, unknown>;
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
        this.addPlacement(
          parsed.iWine as string,
          parsed.setupId as string,
          parsed.shelf as number,
          parsed.layer as number,
          parsed.slot as number,
        );
        this.broadcast(ws, JSON.stringify({ type: "placementAdded", iWine: parsed.iWine, setupId: parsed.setupId, shelf: parsed.shelf, layer: parsed.layer, slot: parsed.slot }));
        ws.send(JSON.stringify({ type: "ack" }));
        break;
      case "removePlacement":
        this.removePlacement(
          parsed.iWine as string,
          parsed.setupId as string,
          parsed.shelf as number,
          parsed.layer as number,
          parsed.slot as number,
        );
        this.broadcast(ws, JSON.stringify({ type: "placementRemoved", iWine: parsed.iWine, setupId: parsed.setupId, shelf: parsed.shelf, layer: parsed.layer, slot: parsed.slot }));
        ws.send(JSON.stringify({ type: "ack" }));
        break;
      default:
        ws.send(JSON.stringify({ type: "error", message: `Unknown message type: ${parsed.type}` }));
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string): Promise<void> {
    ws.close(code, reason);
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    ws.close(1011, "Internal error");
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
    let parsed: Record<string, unknown>;
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
        ws.send(JSON.stringify({ type: "setup", data: this.getSetup(parsed.id as string) }));
        break;
      case "setSetup":
        ws.send(JSON.stringify({
          type: "savedSetup",
          id: this.setSetup(
            parsed.id as string | null,
            parsed.name as string,
            parsed.config as StorageSetup,
          ),
        }));
        break;
      default:
        ws.send(JSON.stringify({ type: "error", message: `Unknown message type: ${parsed.type}` }));
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string): Promise<void> {
    ws.close(code, reason);
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    ws.close(1011, "Internal error");
  }
}
