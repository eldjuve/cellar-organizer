import { env } from "cloudflare:test";
import { describe, it, expect } from "vitest";
import type { WineItem } from "../types";

function makeWine(overrides: Partial<WineItem> & { iWine: string; Wine: string; Producer: string }): WineItem {
  return {
    WineBarcode: "",
    Quantity: "1",
    Pending: "0",
    Size: "750ml",
    Price: "0",
    Valuation: "0",
    MyValue: "0",
    MenuPrice: "0",
    Currency: "USD",
    Vintage: "2020",
    Locale: "",
    Country: "",
    Region: "",
    SubRegion: "",
    Appellation: "",
    SortProducer: "",
    Type: "Red",
    Color: "Red",
    Category: "",
    Varietal: "",
    MasterVarietal: "",
    Designation: "",
    Vineyard: "",
    CT: "",
    CNotes: "",
    BeginConsume: "",
    EndConsume: "",
    UPC: "",
    ...overrides,
  };
}

function getStub(name = "test-wine") {
  return env.WINE_STORE.get(env.WINE_STORE.idFromName(name));
}

describe("setInventory / getCount", () => {
  it("stores wines and getCount returns correct count", async () => {
    const stub = getStub("count-basic");
    await stub.setInventory([
      makeWine({ iWine: "1", Wine: "Margaux", Producer: "Château Margaux" }),
      makeWine({ iWine: "2", Wine: "Latour", Producer: "Château Latour" }),
    ]);
    expect(await stub.getCount()).toBe(2);
  });

  it("replaces all wines on second call (DELETE + re-INSERT)", async () => {
    const stub = getStub("count-replace");
    await stub.setInventory([
      makeWine({ iWine: "1", Wine: "Wine A", Producer: "Producer A" }),
      makeWine({ iWine: "2", Wine: "Wine B", Producer: "Producer B" }),
    ]);
    await stub.setInventory([
      makeWine({ iWine: "3", Wine: "Wine C", Producer: "Producer C" }),
    ]);
    expect(await stub.getCount()).toBe(1);
    const wines = await stub.queryInventory();
    expect(wines[0].iWine).toBe("3");
  });

  it("handles an empty array", async () => {
    const stub = getStub("count-empty");
    await stub.setInventory([]);
    expect(await stub.getCount()).toBe(0);
  });
});

describe("queryInventory — no filters", () => {
  it("returns all wines", async () => {
    const stub = getStub("query-all");
    await stub.setInventory([
      makeWine({ iWine: "1", Wine: "Red Wine", Producer: "A" }),
      makeWine({ iWine: "2", Wine: "White Wine", Producer: "B", Type: "White" }),
    ]);
    const result = await stub.queryInventory();
    expect(result).toHaveLength(2);
  });

  it("returns empty array when store is empty", async () => {
    const stub = getStub("query-empty");
    const result = await stub.queryInventory();
    expect(result).toEqual([]);
  });
});

describe("queryInventory — q (text search)", () => {
  it("matches by wine name substring (case-insensitive)", async () => {
    const stub = getStub("query-q-name");
    await stub.setInventory([
      makeWine({ iWine: "1", Wine: "Château Margaux", Producer: "Château Margaux" }),
      makeWine({ iWine: "2", Wine: "Pétrus", Producer: "Pomerol" }),
    ]);
    const result = await stub.queryInventory("margaux");
    expect(result).toHaveLength(1);
    expect(result[0].iWine).toBe("1");
  });

  it("matches by producer substring", async () => {
    const stub = getStub("query-q-producer");
    await stub.setInventory([
      makeWine({ iWine: "1", Wine: "Opus One", Producer: "Mondavi" }),
      makeWine({ iWine: "2", Wine: "Other Wine", Producer: "Other" }),
    ]);
    const result = await stub.queryInventory("mondavi");
    expect(result).toHaveLength(1);
    expect(result[0].iWine).toBe("1");
  });

  it("returns empty array when no match", async () => {
    const stub = getStub("query-q-nomatch");
    await stub.setInventory([
      makeWine({ iWine: "1", Wine: "Wine A", Producer: "Producer A" }),
    ]);
    const result = await stub.queryInventory("zzznomatch");
    expect(result).toEqual([]);
  });

  it("q combines with type (AND)", async () => {
    const stub = getStub("query-q-type");
    await stub.setInventory([
      makeWine({ iWine: "1", Wine: "Bordeaux Rouge", Producer: "A", Type: "Red" }),
      makeWine({ iWine: "2", Wine: "Bordeaux Blanc", Producer: "A", Type: "White" }),
    ]);
    const result = await stub.queryInventory("bordeaux", "White");
    expect(result).toHaveLength(1);
    expect(result[0].iWine).toBe("2");
  });
});

describe("queryInventory — type filter", () => {
  it("returns only wines with matching type", async () => {
    const stub = getStub("query-type");
    await stub.setInventory([
      makeWine({ iWine: "1", Wine: "Red A", Producer: "P", Type: "Red" }),
      makeWine({ iWine: "2", Wine: "White A", Producer: "P", Type: "White" }),
      makeWine({ iWine: "3", Wine: "Red B", Producer: "P", Type: "Red" }),
    ]);
    const result = await stub.queryInventory(undefined, "Red");
    expect(result).toHaveLength(2);
    expect(result.every((w) => w.Type === "Red")).toBe(true);
  });

  it("returns empty array when no match", async () => {
    const stub = getStub("query-type-nomatch");
    await stub.setInventory([
      makeWine({ iWine: "1", Wine: "Red A", Producer: "P", Type: "Red" }),
    ]);
    const result = await stub.queryInventory(undefined, "Sparkling");
    expect(result).toEqual([]);
  });
});

describe("queryInventory — country filter", () => {
  it("returns only wines with matching country", async () => {
    const stub = getStub("query-country");
    await stub.setInventory([
      makeWine({ iWine: "1", Wine: "Bordeaux", Producer: "A", Country: "France" }),
      makeWine({ iWine: "2", Wine: "Napa", Producer: "B", Country: "USA" }),
      makeWine({ iWine: "3", Wine: "Burgundy", Producer: "C", Country: "France" }),
    ]);
    const result = await stub.queryInventory(undefined, undefined, "France");
    expect(result).toHaveLength(2);
    expect(result.every((w) => w.Country === "France")).toBe(true);
  });
});

describe("queryInventory — combined filters", () => {
  it("applies q + type + country simultaneously", async () => {
    const stub = getStub("query-combined");
    await stub.setInventory([
      makeWine({ iWine: "1", Wine: "Pinot Noir A", Producer: "A", Type: "Red", Country: "France" }),
      makeWine({ iWine: "2", Wine: "Pinot Noir B", Producer: "B", Type: "Red", Country: "USA" }),
      makeWine({ iWine: "3", Wine: "Chardonnay", Producer: "C", Type: "White", Country: "France" }),
    ]);
    const result = await stub.queryInventory("pinot", "Red", "France");
    expect(result).toHaveLength(1);
    expect(result[0].iWine).toBe("1");
  });
});

describe("lookupBarcode", () => {
  it("finds wine by wine_barcode", async () => {
    const stub = getStub("barcode-1");
    await stub.setInventory([
      makeWine({ iWine: "1", Wine: "Labeled", Producer: "P", WineBarcode: "BAR123" }),
    ]);
    const result = await stub.lookupBarcode("BAR123");
    expect(result).not.toBeNull();
    expect(result!.iWine).toBe("1");
  });

  it("finds wine by UPC when wine_barcode does not match", async () => {
    const stub = getStub("barcode-upc");
    await stub.setInventory([
      makeWine({ iWine: "1", Wine: "UPC Wine", Producer: "P", UPC: "UPC999" }),
    ]);
    const result = await stub.lookupBarcode("UPC999");
    expect(result).not.toBeNull();
    expect(result!.iWine).toBe("1");
  });

  it("returns null when no barcode matches", async () => {
    const stub = getStub("barcode-miss");
    await stub.setInventory([
      makeWine({ iWine: "1", Wine: "Wine", Producer: "P", WineBarcode: "BAR123" }),
    ]);
    const result = await stub.lookupBarcode("NOMATCH");
    expect(result).toBeNull();
  });

  it("returns null on empty store", async () => {
    const stub = getStub("barcode-empty");
    const result = await stub.lookupBarcode("anything");
    expect(result).toBeNull();
  });
});

describe("getFilterOptions", () => {
  it("returns distinct types in alphabetical order", async () => {
    const stub = getStub("filter-types");
    await stub.setInventory([
      makeWine({ iWine: "1", Wine: "A", Producer: "P", Type: "Red" }),
      makeWine({ iWine: "2", Wine: "B", Producer: "P", Type: "White" }),
      makeWine({ iWine: "3", Wine: "C", Producer: "P", Type: "Red" }),
    ]);
    const { types } = await stub.getFilterOptions();
    expect(types).toEqual(["Red", "White"]);
  });

  it("returns distinct countries in alphabetical order", async () => {
    const stub = getStub("filter-countries");
    await stub.setInventory([
      makeWine({ iWine: "1", Wine: "A", Producer: "P", Country: "Italy" }),
      makeWine({ iWine: "2", Wine: "B", Producer: "P", Country: "France" }),
      makeWine({ iWine: "3", Wine: "C", Producer: "P", Country: "France" }),
    ]);
    const { countries } = await stub.getFilterOptions();
    expect(countries).toEqual(["France", "Italy"]);
  });

  it("excludes NULL types/countries", async () => {
    const stub = getStub("filter-nulls");
    await stub.setInventory([
      makeWine({ iWine: "1", Wine: "A", Producer: "P" }), // Type defaults to "Red", Country defaults to ""
      makeWine({ iWine: "2", Wine: "B", Producer: "P", Type: "White", Country: "Spain" }),
    ]);
    // Type="" is stored as "" not NULL; we care about actual NULLs
    // Reset with explicit null-like values
    const stub2 = getStub("filter-nulls-explicit");
    // WineInventoryStore stores null for missing Type/Country
    const wines: WineItem[] = [
      { ...makeWine({ iWine: "1", Wine: "A", Producer: "P" }), Type: undefined as unknown as string, Country: undefined as unknown as string },
      makeWine({ iWine: "2", Wine: "B", Producer: "P", Type: "White", Country: "Spain" }),
    ];
    await stub2.setInventory(wines);
    const { types, countries } = await stub2.getFilterOptions();
    expect(types).not.toContain(null);
    expect(types).not.toContain(undefined);
    expect(countries).not.toContain(null);
    expect(types).toContain("White");
    expect(countries).toContain("Spain");
  });

  it("returns empty arrays on empty store", async () => {
    const stub = getStub("filter-empty");
    const { types, countries } = await stub.getFilterOptions();
    expect(types).toEqual([]);
    expect(countries).toEqual([]);
  });

  it("does not return duplicates when multiple wines share type", async () => {
    const stub = getStub("filter-dedup");
    await stub.setInventory([
      makeWine({ iWine: "1", Wine: "A", Producer: "P", Type: "Red" }),
      makeWine({ iWine: "2", Wine: "B", Producer: "P", Type: "Red" }),
      makeWine({ iWine: "3", Wine: "C", Producer: "P", Type: "Red" }),
    ]);
    const { types } = await stub.getFilterOptions();
    expect(types).toEqual(["Red"]);
    expect(types.length).toBe(1);
  });
});

describe("getWinesByIds", () => {
  it("returns wines for all requested IDs", async () => {
    const stub = getStub("byids-basic");
    await stub.setInventory([
      makeWine({ iWine: "1", Wine: "A", Producer: "P" }),
      makeWine({ iWine: "2", Wine: "B", Producer: "P" }),
      makeWine({ iWine: "3", Wine: "C", Producer: "P" }),
    ]);
    const result = await stub.getWinesByIds(["1", "3"]);
    expect(result).toHaveLength(2);
    const ids = result.map((w) => w.iWine).sort();
    expect(ids).toEqual(["1", "3"]);
  });

  it("returns empty array for empty ID list", async () => {
    const stub = getStub("byids-empty");
    await stub.setInventory([
      makeWine({ iWine: "1", Wine: "A", Producer: "P" }),
    ]);
    const result = await stub.getWinesByIds([]);
    expect(result).toEqual([]);
  });

  it("ignores IDs that don't exist", async () => {
    const stub = getStub("byids-missing");
    await stub.setInventory([
      makeWine({ iWine: "1", Wine: "A", Producer: "P" }),
    ]);
    const result = await stub.getWinesByIds(["1", "999"]);
    expect(result).toHaveLength(1);
    expect(result[0].iWine).toBe("1");
  });
});
