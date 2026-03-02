import { env as cloudflareEnv } from "cloudflare:workers";
import type { BottlePlacementStore, StorageSetupStore, WineInventoryStore } from "./app";

interface EnvWithStorage extends Cloudflare.Env {
  BOTTLE_STORE: DurableObjectNamespace<BottlePlacementStore>;
  SETUP_STORE:  DurableObjectNamespace<StorageSetupStore>;
  WINE_STORE:   DurableObjectNamespace<WineInventoryStore>;
}

export const env: EnvWithStorage = cloudflareEnv as EnvWithStorage;
