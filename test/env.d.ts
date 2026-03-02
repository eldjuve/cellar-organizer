/// <reference types="@cloudflare/vitest-pool-workers" />

import type {
  StorageSetupStore,
  WineInventoryStore,
} from "../workers/app";

declare module "cloudflare:test" {
  interface ProvidedEnv {
    SETUP_STORE: DurableObjectNamespace<StorageSetupStore>;
    WINE_STORE: DurableObjectNamespace<WineInventoryStore>;
  }
}
