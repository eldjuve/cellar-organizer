import { env as cloudflareEnv } from "cloudflare:workers";
import type { StorageConfigStore, WineInventoryStore } from "./app";

interface EnvWithStorage extends Cloudflare.Env {
  CONFIG_STORE: DurableObjectNamespace<StorageConfigStore>;
  WINE_STORE:   DurableObjectNamespace<WineInventoryStore>;
}

export const env: EnvWithStorage = cloudflareEnv as EnvWithStorage;
