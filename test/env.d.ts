/// <reference types="@cloudflare/vitest-pool-workers" />

import type {
  StorageConfigStore,
  WineInventoryStore,
} from "../workers/app";

declare module "cloudflare:test" {
  interface ProvidedEnv {
    CONFIG_STORE: DurableObjectNamespace<StorageConfigStore>;
    WINE_STORE: DurableObjectNamespace<WineInventoryStore>;
  }
}
