import { DurableObject } from "cloudflare:workers";
import type { BottlePlacement, BottlePlacements, WineMatrix, WineItem } from "types";

export class WineInventoryStore extends DurableObject<Env> {
  readonly #cache = new Map<string, unknown>();

  #get<T>(key: string): T | undefined {
    return this.#cache.get(key) as T | undefined;
  }
  #set(key: string, value: unknown): void {
    this.#cache.set(key, value);
  }
  #invalidate(): void {
    this.#cache.clear();
  }

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

  setWines(wines: WineItem[]): void {
    this.ctx.storage.sql.exec("DELETE FROM wines");
    for (const w of wines) {
      this.ctx.storage.sql.exec(
        `INSERT INTO wines (iWine, wine, producer, type, country, quantity, wine_barcode, upc, data)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        w.iWine, w.Wine, w.Producer, w.Type ?? null, w.Country ?? null,
        Number(w.Quantity), w.WineBarcode || null, w.UPC || null, JSON.stringify(w),
      );
    }
    this.#invalidate();
  }

  getCount(): number {
    const rows = [...this.ctx.storage.sql.exec<{ n: number }>("SELECT COUNT(*) AS n FROM wines")];
    return rows[0].n;
  }

  queryWines(q?: string, type?: string, country?: string, placement?: "all" | "active" | "pending", configId?: string): WineItem[] {
    const key = `qi:${q}:${type}:${country}:${placement}:${configId}`;
    const hit = this.#get<WineItem[]>(key);
    if (hit) return hit;
    let sql = `SELECT w.data, json_group_array(
      CASE WHEN p.setup_id IS NULL THEN NULL
      ELSE json_object('configId', p.setup_id, 'shelf', p.shelf, 'layer', p.layer, 'slot', p.slot)
      END
    ) AS placements_json
    FROM wines w
    LEFT JOIN placements p ON w.iWine = p.iWine
    WHERE 1=1`;
    const params: unknown[] = [];
    if (type)    { sql += " AND w.type = ?";                                   params.push(type); }
    if (country) { sql += " AND w.country = ?";                                params.push(country); }
    if (q)       { sql += " AND (w.wine LIKE ? OR w.producer LIKE ?)";         params.push(`%${q}%`, `%${q}%`); }
    if (placement === "active" && configId) {
      sql += " AND EXISTS (SELECT 1 FROM placements p2 WHERE p2.iWine = w.iWine AND p2.setup_id = ?)";
      params.push(configId);
    }
    if (placement === "pending") {
      sql += " AND (SELECT COUNT(*) FROM placements p2 WHERE p2.iWine = w.iWine) < w.quantity";
    }
    sql += " GROUP BY w.iWine";
    const result = [...this.ctx.storage.sql.exec<{ data: string; placements_json: string }>(sql, ...params)]
      .map((r) => {
        const wine: WineItem = JSON.parse(r.data);
        const rawPlacements: (BottlePlacement | null)[] = JSON.parse(r.placements_json);
        wine.placements = rawPlacements.filter((p): p is BottlePlacement => p !== null);
        return wine;
      });
    this.#set(key, result);
    return result;
  }

  getWineById(iWine: string): WineItem | null {
    const rows = [...this.ctx.storage.sql.exec<{ data: string; placements_json: string }>(
      `SELECT w.data, json_group_array(
      CASE WHEN p.setup_id IS NULL THEN NULL
      ELSE json_object('configId', p.setup_id, 'shelf', p.shelf, 'layer', p.layer, 'slot', p.slot)
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
    wine.placements = rawPlacements.filter((p): p is BottlePlacement => p !== null);
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
    const hit = this.#get<{ types: string[]; countries: string[] }>("fo");
    if (hit) return hit;
    const types = [...this.ctx.storage.sql.exec<{ type: string }>(
      "SELECT DISTINCT type FROM wines WHERE type IS NOT NULL ORDER BY type",
    )].map((r) => r.type);
    const countries = [...this.ctx.storage.sql.exec<{ country: string }>(
      "SELECT DISTINCT country FROM wines WHERE country IS NOT NULL ORDER BY country",
    )].map((r) => r.country);
    const result = { types, countries };
    this.#set("fo", result);
    return result;
  }

  addPlacement(iWine: string, configId: string, shelf: number, layer: number, slot: number): { ok: true } | { ok: false; error: string } {
    try {
      const cursor = this.ctx.storage.sql.exec(
        `INSERT OR IGNORE INTO placements (iWine, setup_id, shelf, layer, slot)
         SELECT ?, ?, ?, ?, ?
         WHERE (SELECT COUNT(*) FROM placements WHERE iWine = ?)
             < (SELECT quantity FROM wines WHERE iWine = ?)`,
        iWine, configId, shelf, layer, slot, iWine, iWine,
      );
      if (cursor.rowsWritten === 0) return { ok: false, error: "placement failed" };
    } catch {
      return { ok: false, error: "placement failed" };
    }
    this.#invalidate();
    return { ok: true };
  }

  removePlacement(iWine: string, configId: string, shelf: number, layer: number, slot: number) {
    this.ctx.storage.sql.exec(
      "DELETE FROM placements WHERE iWine = ? AND setup_id = ? AND shelf = ? AND layer = ? AND slot = ?",
      iWine, configId, shelf, layer, slot,
    );
    this.#invalidate();
  }

  getWinePlacements(): BottlePlacements {
    type Row = { iWine: string; setup_id: string; shelf: number; layer: number; slot: number };
    const rows = [...this.ctx.storage.sql.exec<Row>(
      "SELECT iWine, setup_id, shelf, layer, slot FROM placements",
    )];
    return rows.reduce((acc, { iWine, setup_id, shelf, layer, slot }) => {
      (acc[iWine] ??= []).push({ configId: setup_id, shelf, layer, slot });
      return acc;
    }, {} as BottlePlacements);
  }

  getWineMatrix(configId: string): WineMatrix {
    const hit = this.#get<WineMatrix>(`ws:${configId}`);
    if (hit) return hit;
    type Row = { data: string; shelf: number; layer: number; slot: number; placements_json: string };
    const rows = [...this.ctx.storage.sql.exec<Row>(
      `SELECT w.data, p.shelf, p.layer, p.slot,
              json_group_array(json_object('configId', p2.setup_id, 'shelf', p2.shelf, 'layer', p2.layer, 'slot', p2.slot)) AS placements_json
       FROM wines w
       JOIN placements p  ON w.iWine = p.iWine AND p.setup_id = ?
       JOIN placements p2 ON w.iWine = p2.iWine
       GROUP BY p.shelf, p.layer, p.slot`,
      configId,
    )];
    const matrix: WineMatrix = {};
    for (const { data, shelf, layer, slot, placements_json } of rows) {
      const wine: WineItem = JSON.parse(data);
      wine.placements = JSON.parse(placements_json);
      matrix[shelf] ??= {};
      matrix[shelf][layer] ??= {};
      matrix[shelf][layer][slot] = wine;
    }
    this.#set(`ws:${configId}`, matrix);
    return matrix;
  }

  private sseControllers = new Map<string, ReadableStreamDefaultController<Uint8Array>>();

  private broadcastAll(message: string, excludeClientId?: string) {
    const chunk = new TextEncoder().encode(`data: ${message}\n\n`);
    for (const [id, controller] of this.sseControllers) {
      if (id === excludeClientId) continue;
      try { controller.enqueue(chunk); }
      catch { this.sseControllers.delete(id); }
    }
  }

  notifyPlacementAdded(iWine: string, configId: string, shelf: number, layer: number, slot: number, excludeClientId?: string): void {
    this.broadcastAll(JSON.stringify({ type: "placementAdded", iWine, configId, shelf, layer, slot }), excludeClientId);
  }

  notifyPlacementRemoved(iWine: string, configId: string, shelf: number, layer: number, slot: number, excludeClientId?: string): void {
    this.broadcastAll(JSON.stringify({ type: "placementRemoved", iWine, configId, shelf, layer, slot }), excludeClientId);
  }

  async fetch(request: Request): Promise<Response> {
    const clientId = new URL(request.url).searchParams.get("clientId") ?? crypto.randomUUID();
    let controller!: ReadableStreamDefaultController<Uint8Array>;
    const stream = new ReadableStream<Uint8Array>({
      start: (c) => { controller = c; this.sseControllers.set(clientId, c); },
      cancel: () => { this.sseControllers.delete(clientId); },
    });
    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    });
  }
}
