import { env as cloudflareEnv } from "cloudflare:workers";
import type { BottlePlacementStore, StorageSetupStore } from "./app";

interface EnvWithStorage extends Cloudflare.Env {
  BOTTLE_STORE: DurableObjectNamespace<BottlePlacementStore>;
  SETUP_STORE: DurableObjectNamespace<StorageSetupStore>;
}

export const env: EnvWithStorage = cloudflareEnv as EnvWithStorage;
