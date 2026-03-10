import { env } from "cloudflare:test";
import { describe, it, expect } from "vitest";
import type { StorageConfig } from "../types";

function getStub(name = "test-config") {
  return env.CONFIG_STORE.get(env.CONFIG_STORE.idFromName(name));
}

// Simulates how the app resolves a user's store: env.CONFIG_STORE.getByName(username)
function getUserStub(username: string) {
  return env.CONFIG_STORE.get(env.CONFIG_STORE.idFromName(username));
}

const sampleConfig: StorageConfig = [
  { capacity: 8, innerRow: false, layers: 1 },
  { capacity: 6, innerRow: true, layers: 2 },
];

describe("setConfig — create", () => {
  it("creates a new config with a generated UUID when id is null", async () => {
    const stub = getStub("create-basic");
    const id = await stub.setConfig(null, "My Cellar", sampleConfig);
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("returns different IDs for different creates", async () => {
    const stub = getStub("create-unique");
    const id1 = await stub.setConfig(null, "Cellar A", sampleConfig);
    const id2 = await stub.setConfig(null, "Cellar B", sampleConfig);
    expect(id1).not.toBe(id2);
  });

  it("persists the name and config", async () => {
    const stub = getStub("create-persist");
    const id = await stub.setConfig(null, "Basement Rack", sampleConfig);
    const result = await stub.getConfig(id);
    expect(result).not.toBeNull();
    expect(result!.name).toBe("Basement Rack");
    expect(result!.config).toEqual(sampleConfig);
  });
});

describe("setConfig — update", () => {
  it("updates name and config for an existing id", async () => {
    const stub = getStub("update-basic");
    const id = await stub.setConfig(null, "Original Name", sampleConfig);
    const newConfig: StorageConfig = [{ capacity: 12, innerRow: false, layers: 3 }];
    const returnedId = await stub.setConfig(id, "Updated Name", newConfig);
    expect(returnedId).toBe(id);
    const result = await stub.getConfig(id);
    expect(result!.name).toBe("Updated Name");
    expect(result!.config).toEqual(newConfig);
  });

  it("returns the same id after update", async () => {
    const stub = getStub("update-returns-same-id");
    const id = await stub.setConfig(null, "Config", sampleConfig);
    const returned = await stub.setConfig(id, "Config Renamed", sampleConfig);
    expect(returned).toBe(id);
  });
});

describe("getConfig", () => {
  it("returns null for an unknown id", async () => {
    const stub = getStub("get-missing");
    const result = await stub.getConfig("non-existent-id");
    expect(result).toBeNull();
  });

  it("returns the correct config after creation", async () => {
    const stub = getStub("get-correct");
    const id = await stub.setConfig(null, "Wine Rack", sampleConfig);
    const result = await stub.getConfig(id);
    expect(result).toEqual({ name: "Wine Rack", config: sampleConfig });
  });

  it("reflects the latest state after an update", async () => {
    const stub = getStub("get-after-update");
    const id = await stub.setConfig(null, "Old Name", sampleConfig);
    const newConfig: StorageConfig = [{ capacity: 4, innerRow: true, layers: 1 }];
    await stub.setConfig(id, "New Name", newConfig);
    const result = await stub.getConfig(id);
    expect(result!.name).toBe("New Name");
    expect(result!.config).toEqual(newConfig);
  });
});

describe("getConfigList", () => {
  it("returns empty array when no configs exist", async () => {
    const stub = getStub("list-empty");
    const list = await stub.getConfigList();
    expect(list).toEqual([]);
  });

  it("returns id and name for each config", async () => {
    const stub = getStub("list-basic");
    const id = await stub.setConfig(null, "Only Config", sampleConfig);
    const list = await stub.getConfigList();
    expect(list).toHaveLength(1);
    expect(list[0]).toEqual({ id, name: "Only Config" });
  });

  it("returns all configs ordered by name", async () => {
    const stub = getStub("list-ordered");
    await stub.setConfig(null, "Zebra", sampleConfig);
    await stub.setConfig(null, "Alpha", sampleConfig);
    await stub.setConfig(null, "Mango", sampleConfig);
    const list = await stub.getConfigList();
    expect(list.map((s) => s.name)).toEqual(["Alpha", "Mango", "Zebra"]);
  });

  it("does not include deleted configs", async () => {
    const stub = getStub("list-after-delete");
    const id = await stub.setConfig(null, "To Delete", sampleConfig);
    await stub.setConfig(null, "To Keep", sampleConfig);
    await stub.deleteConfig(id);
    const list = await stub.getConfigList();
    expect(list.every((s) => s.name !== "To Delete")).toBe(true);
    expect(list.some((s) => s.name === "To Keep")).toBe(true);
  });
});

describe("user isolation", () => {
  it("configs created by alice are not visible to bob", async () => {
    const alice = getUserStub("alice-isolation-1");
    const bob = getUserStub("bob-isolation-1");
    await alice.setConfig(null, "Alice's Rack", sampleConfig);
    const bobList = await bob.getConfigList();
    expect(bobList).toHaveLength(0);
  });

  it("bob cannot getConfig using an id returned for alice", async () => {
    const alice = getUserStub("alice-isolation-2");
    const bob = getUserStub("bob-isolation-2");
    const id = await alice.setConfig(null, "Alice's Config", sampleConfig);
    const result = await bob.getConfig(id);
    expect(result).toBeNull();
  });

  it("bob cannot delete alice's config", async () => {
    const alice = getUserStub("alice-isolation-3");
    const bob = getUserStub("bob-isolation-3");
    const id = await alice.setConfig(null, "Alice's Config", sampleConfig);
    await bob.deleteConfig(id); // no-op on bob's empty store
    const result = await alice.getConfig(id);
    expect(result).not.toBeNull(); // alice's data is untouched
  });

  it("alice and bob can each have a config with the same name independently", async () => {
    const alice = getUserStub("alice-isolation-4");
    const bob = getUserStub("bob-isolation-4");
    const aliceId = await alice.setConfig(null, "Shared Name", sampleConfig);
    const bobId = await bob.setConfig(null, "Shared Name", sampleConfig);
    expect(aliceId).not.toBe(bobId);
    const aliceResult = await alice.getConfig(aliceId);
    const bobResult = await bob.getConfig(bobId);
    expect(aliceResult).not.toBeNull();
    expect(bobResult).not.toBeNull();
  });
});

describe("deleteConfig", () => {
  it("removes the config so getConfig returns null", async () => {
    const stub = getStub("delete-basic");
    const id = await stub.setConfig(null, "Temporary", sampleConfig);
    await stub.deleteConfig(id);
    const result = await stub.getConfig(id);
    expect(result).toBeNull();
  });

  it("is a no-op for a non-existent id", async () => {
    const stub = getStub("delete-noop");
    await stub.setConfig(null, "Real Config", sampleConfig);
    await stub.deleteConfig("ghost-id"); // should not throw
    const list = await stub.getConfigList();
    expect(list).toHaveLength(1);
  });

  it("only removes the targeted config", async () => {
    const stub = getStub("delete-targeted");
    const id1 = await stub.setConfig(null, "Config One", sampleConfig);
    const id2 = await stub.setConfig(null, "Config Two", sampleConfig);
    await stub.deleteConfig(id1);
    expect(await stub.getConfig(id1)).toBeNull();
    expect(await stub.getConfig(id2)).not.toBeNull();
  });
});
