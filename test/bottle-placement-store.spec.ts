import { env } from "cloudflare:test";
import { describe, it, expect } from "vitest";
import type { BottlePlacement, WineItem } from "types";

function getStub(name = "test") {
  return env.WINE_STORE.get(env.WINE_STORE.idFromName(name));
}

function makeWine(iWine: string, quantity = 99): WineItem {
  return {
    iWine, Wine: iWine, Producer: "P", Quantity: String(quantity),
    WineBarcode: "", Pending: "0", Size: "750ml", Price: "0", Valuation: "0",
    MyValue: "0", MenuPrice: "0", Currency: "USD", Vintage: "2020", Locale: "",
    Country: "", Region: "", SubRegion: "", Appellation: "", SortProducer: "",
    Type: "Red", Color: "Red", Category: "", Varietal: "", MasterVarietal: "",
    Designation: "", Vineyard: "", CT: "", CNotes: "", BeginConsume: "",
    EndConsume: "", UPC: "",
  };
}

describe("addPlacement / getInventory", () => {
  it("stores a placement and getInventory returns it", async () => {
    const stub = getStub();
    await stub.setInventory([makeWine("wine1")]);
    await stub.addPlacement("wine1", "setup1", 0, 0, 0);
    const inv = await stub.getInventory();
    expect(inv).toEqual({
      wine1: [{ setupId: "setup1", shelf: 0, layer: 0, slot: 0 }],
    });
  });

  it("returns empty object on a fresh instance", async () => {
    const stub = getStub("fresh-empty");
    const inv = await stub.getInventory();
    expect(inv).toEqual({});
  });

  it("groups multiple placements for the same wine under one key", async () => {
    const stub = getStub("group-test");
    await stub.setInventory([makeWine("wineA", 99)]);
    await stub.addPlacement("wineA", "setup1", 0, 0, 0);
    await stub.addPlacement("wineA", "setup1", 1, 0, 0);
    const inv = await stub.getInventory();
    expect(inv["wineA"]).toHaveLength(2);
  });

  it("INSERT OR IGNORE: duplicate position is silently ignored", async () => {
    const stub = getStub("dup-pos");
    await stub.setInventory([makeWine("wine1")]);
    await stub.addPlacement("wine1", "setup1", 0, 0, 0);
    await stub.addPlacement("wine1", "setup1", 0, 0, 0);
    const inv = await stub.getInventory();
    expect(inv["wine1"]).toHaveLength(1);
  });

  it("INSERT OR IGNORE: different wine at occupied position is ignored", async () => {
    const stub = getStub("conflict");
    await stub.setInventory([makeWine("wine1"), makeWine("wine2")]);
    await stub.addPlacement("wine1", "setup1", 0, 0, 0);
    await stub.addPlacement("wine2", "setup1", 0, 0, 0);
    const inv = await stub.getInventory();
    expect(inv["wine1"]).toHaveLength(1);
    expect(inv["wine2"]).toBeUndefined();
  });

  it("returns ok:false when wine does not exist in inventory", async () => {
    const stub = getStub("no-wine");
    const result = await stub.addPlacement("ghost", "setup1", 0, 0, 0);
    expect(result).toEqual({ ok: false, error: "placement failed" });
    const inv = await stub.getInventory();
    expect(inv["ghost"]).toBeUndefined();
  });
});

describe("removePlacement", () => {
  it("removes a placement, getInventory becomes empty", async () => {
    const stub = getStub("rm-basic");
    await stub.setInventory([makeWine("wine1")]);
    await stub.addPlacement("wine1", "setup1", 0, 0, 0);
    await stub.removePlacement("wine1", "setup1", 0, 0, 0);
    const inv = await stub.getInventory();
    expect(inv).toEqual({});
  });

  it("removes one of multiple placements for the same wine", async () => {
    const stub = getStub("rm-one");
    await stub.setInventory([makeWine("wineA", 99)]);
    await stub.addPlacement("wineA", "setup1", 0, 0, 0);
    await stub.addPlacement("wineA", "setup1", 1, 0, 0);
    await stub.removePlacement("wineA", "setup1", 0, 0, 0);
    const inv = await stub.getInventory();
    expect(inv["wineA"]).toHaveLength(1);
    expect(inv["wineA"][0]).toEqual({ setupId: "setup1", shelf: 1, layer: 0, slot: 0 });
  });

  it("is a no-op when placement does not exist", async () => {
    const stub = getStub("rm-noop");
    await stub.setInventory([makeWine("wine1")]);
    await stub.addPlacement("wine1", "setup1", 0, 0, 0);
    await stub.removePlacement("wine1", "setup1", 9, 9, 9);
    const inv = await stub.getInventory();
    expect(inv["wine1"]).toHaveLength(1);
  });

  it("does not remove a placement in a different setup", async () => {
    const stub = getStub("rm-other-setup");
    await stub.setInventory([makeWine("wine1")]);
    await stub.addPlacement("wine1", "setup1", 0, 0, 0);
    await stub.removePlacement("wine1", "setup2", 0, 0, 0);
    const inv = await stub.getInventory();
    expect(inv["wine1"]).toHaveLength(1);
  });

  it("does not remove a placement at a different slot", async () => {
    const stub = getStub("rm-diff-slot");
    await stub.setInventory([makeWine("wine1")]);
    await stub.addPlacement("wine1", "setup1", 0, 0, 0);
    await stub.removePlacement("wine1", "setup1", 0, 0, 1);
    const inv = await stub.getInventory();
    expect(inv["wine1"]).toHaveLength(1);
  });
});

describe("getInventory", () => {
  it("returns correct BottlePlacement shape for each row", async () => {
    const stub = getStub("shape-check");
    await stub.setInventory([makeWine("wine1")]);
    await stub.addPlacement("wine1", "setup1", 2, 3, 4);
    const inv = await stub.getInventory();
    expect(inv["wine1"][0]).toMatchObject({
      setupId: "setup1",
      shelf: 2,
      layer: 3,
      slot: 4,
    });
  });

  it("returns placements across multiple setup IDs", async () => {
    const stub = getStub("multi-setup");
    await stub.setInventory([makeWine("wine1", 99)]);
    await stub.addPlacement("wine1", "setupA", 0, 0, 0);
    await stub.addPlacement("wine1", "setupB", 0, 0, 0);
    const inv = await stub.getInventory();
    expect(inv["wine1"]).toHaveLength(2);
    const setupIds = inv["wine1"].map((p: BottlePlacement) => p.setupId).sort();
    expect(setupIds).toEqual(["setupA", "setupB"]);
  });
});
