import { env } from "cloudflare:test";
import { describe, it, expect } from "vitest";
import type { StorageSetup } from "../types";

function getStub(name = "test-setup") {
  return env.SETUP_STORE.get(env.SETUP_STORE.idFromName(name));
}

// Simulates how the app resolves a user's store: env.SETUP_STORE.getByName(username)
function getUserStub(username: string) {
  return env.SETUP_STORE.get(env.SETUP_STORE.idFromName(username));
}

const sampleConfig: StorageSetup = [
  { capacity: 8, innerRow: false, layers: 1 },
  { capacity: 6, innerRow: true, layers: 2 },
];

describe("setSetup — create", () => {
  it("creates a new setup with a generated UUID when id is null", async () => {
    const stub = getStub("create-basic");
    const id = await stub.setSetup(null, "My Cellar", sampleConfig);
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("returns different IDs for different creates", async () => {
    const stub = getStub("create-unique");
    const id1 = await stub.setSetup(null, "Cellar A", sampleConfig);
    const id2 = await stub.setSetup(null, "Cellar B", sampleConfig);
    expect(id1).not.toBe(id2);
  });

  it("persists the name and config", async () => {
    const stub = getStub("create-persist");
    const id = await stub.setSetup(null, "Basement Rack", sampleConfig);
    const result = await stub.getSetup(id);
    expect(result).not.toBeNull();
    expect(result!.name).toBe("Basement Rack");
    expect(result!.config).toEqual(sampleConfig);
  });
});

describe("setSetup — update", () => {
  it("updates name and config for an existing id", async () => {
    const stub = getStub("update-basic");
    const id = await stub.setSetup(null, "Original Name", sampleConfig);
    const newConfig: StorageSetup = [{ capacity: 12, innerRow: false, layers: 3 }];
    const returnedId = await stub.setSetup(id, "Updated Name", newConfig);
    expect(returnedId).toBe(id);
    const result = await stub.getSetup(id);
    expect(result!.name).toBe("Updated Name");
    expect(result!.config).toEqual(newConfig);
  });

  it("returns the same id after update", async () => {
    const stub = getStub("update-returns-same-id");
    const id = await stub.setSetup(null, "Setup", sampleConfig);
    const returned = await stub.setSetup(id, "Setup Renamed", sampleConfig);
    expect(returned).toBe(id);
  });
});

describe("getSetup", () => {
  it("returns null for an unknown id", async () => {
    const stub = getStub("get-missing");
    const result = await stub.getSetup("non-existent-id");
    expect(result).toBeNull();
  });

  it("returns the correct setup after creation", async () => {
    const stub = getStub("get-correct");
    const id = await stub.setSetup(null, "Wine Rack", sampleConfig);
    const result = await stub.getSetup(id);
    expect(result).toEqual({ name: "Wine Rack", config: sampleConfig });
  });

  it("reflects the latest state after an update", async () => {
    const stub = getStub("get-after-update");
    const id = await stub.setSetup(null, "Old Name", sampleConfig);
    const newConfig: StorageSetup = [{ capacity: 4, innerRow: true, layers: 1 }];
    await stub.setSetup(id, "New Name", newConfig);
    const result = await stub.getSetup(id);
    expect(result!.name).toBe("New Name");
    expect(result!.config).toEqual(newConfig);
  });
});

describe("getSetupList", () => {
  it("returns empty array when no setups exist", async () => {
    const stub = getStub("list-empty");
    const list = await stub.getSetupList();
    expect(list).toEqual([]);
  });

  it("returns id and name for each setup", async () => {
    const stub = getStub("list-basic");
    const id = await stub.setSetup(null, "Only Setup", sampleConfig);
    const list = await stub.getSetupList();
    expect(list).toHaveLength(1);
    expect(list[0]).toEqual({ id, name: "Only Setup" });
  });

  it("returns all setups ordered by name", async () => {
    const stub = getStub("list-ordered");
    await stub.setSetup(null, "Zebra", sampleConfig);
    await stub.setSetup(null, "Alpha", sampleConfig);
    await stub.setSetup(null, "Mango", sampleConfig);
    const list = await stub.getSetupList();
    expect(list.map((s) => s.name)).toEqual(["Alpha", "Mango", "Zebra"]);
  });

  it("does not include deleted setups", async () => {
    const stub = getStub("list-after-delete");
    const id = await stub.setSetup(null, "To Delete", sampleConfig);
    await stub.setSetup(null, "To Keep", sampleConfig);
    await stub.deleteSetup(id);
    const list = await stub.getSetupList();
    expect(list.every((s) => s.name !== "To Delete")).toBe(true);
    expect(list.some((s) => s.name === "To Keep")).toBe(true);
  });
});

describe("user isolation", () => {
  it("setups created by alice are not visible to bob", async () => {
    const alice = getUserStub("alice-isolation-1");
    const bob = getUserStub("bob-isolation-1");
    await alice.setSetup(null, "Alice's Rack", sampleConfig);
    const bobList = await bob.getSetupList();
    expect(bobList).toHaveLength(0);
  });

  it("bob cannot getSetup using an id returned for alice", async () => {
    const alice = getUserStub("alice-isolation-2");
    const bob = getUserStub("bob-isolation-2");
    const id = await alice.setSetup(null, "Alice's Setup", sampleConfig);
    const result = await bob.getSetup(id);
    expect(result).toBeNull();
  });

  it("bob cannot delete alice's setup", async () => {
    const alice = getUserStub("alice-isolation-3");
    const bob = getUserStub("bob-isolation-3");
    const id = await alice.setSetup(null, "Alice's Setup", sampleConfig);
    await bob.deleteSetup(id); // no-op on bob's empty store
    const result = await alice.getSetup(id);
    expect(result).not.toBeNull(); // alice's data is untouched
  });

  it("alice and bob can each have a setup with the same name independently", async () => {
    const alice = getUserStub("alice-isolation-4");
    const bob = getUserStub("bob-isolation-4");
    const aliceId = await alice.setSetup(null, "Shared Name", sampleConfig);
    const bobId = await bob.setSetup(null, "Shared Name", sampleConfig);
    expect(aliceId).not.toBe(bobId);
    const aliceResult = await alice.getSetup(aliceId);
    const bobResult = await bob.getSetup(bobId);
    expect(aliceResult).not.toBeNull();
    expect(bobResult).not.toBeNull();
  });
});

describe("deleteSetup", () => {
  it("removes the setup so getSetup returns null", async () => {
    const stub = getStub("delete-basic");
    const id = await stub.setSetup(null, "Temporary", sampleConfig);
    await stub.deleteSetup(id);
    const result = await stub.getSetup(id);
    expect(result).toBeNull();
  });

  it("is a no-op for a non-existent id", async () => {
    const stub = getStub("delete-noop");
    await stub.setSetup(null, "Real Setup", sampleConfig);
    await stub.deleteSetup("ghost-id"); // should not throw
    const list = await stub.getSetupList();
    expect(list).toHaveLength(1);
  });

  it("only removes the targeted setup", async () => {
    const stub = getStub("delete-targeted");
    const id1 = await stub.setSetup(null, "Setup One", sampleConfig);
    const id2 = await stub.setSetup(null, "Setup Two", sampleConfig);
    await stub.deleteSetup(id1);
    expect(await stub.getSetup(id1)).toBeNull();
    expect(await stub.getSetup(id2)).not.toBeNull();
  });
});
