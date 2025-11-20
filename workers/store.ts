import { env as cloudflareEnv } from "cloudflare:workers";
import type { BottlePlacementStore } from "./app";

interface EnvWithStorage extends Cloudflare.Env {
  BOTTLE_STORE: DurableObjectNamespace<BottlePlacementStore>;
}

export const env: EnvWithStorage = cloudflareEnv as EnvWithStorage;


