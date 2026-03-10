import { DurableObject } from "cloudflare:workers";
import type { SetupListItem, StorageSetup } from "types";

export class StorageSetupStore extends DurableObject<Env> {
  private sseControllers = new Set<ReadableStreamDefaultController<Uint8Array>>();

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

  private broadcastAll(message: string) {
    const chunk = new TextEncoder().encode(`data: ${message}\n\n`);
    for (const controller of this.sseControllers) {
      try { controller.enqueue(chunk); }
      catch { this.sseControllers.delete(controller); }
    }
  }

  notifySetupChanged(): void {
    this.broadcastAll(JSON.stringify({ type: "setupListChanged" }));
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

  async fetch(_request: Request): Promise<Response> {
    let controller!: ReadableStreamDefaultController<Uint8Array>;
    const stream = new ReadableStream<Uint8Array>({
      start: (c) => { controller = c; this.sseControllers.add(c); },
      cancel: () => { this.sseControllers.delete(controller); },
    });
    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    });
  }
}
