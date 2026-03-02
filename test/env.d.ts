/// <reference types="@cloudflare/vitest-pool-workers" />

import type {
  BottlePlacementStore,
  StorageSetupStore,
  WineInventoryStore,
} from "../workers/app";

declare module "cloudflare:test" {
  interface ProvidedEnv {
    BOTTLE_STORE: DurableObjectNamespace<BottlePlacementStore>;
    SETUP_STORE: DurableObjectNamespace<StorageSetupStore>;
    WINE_STORE: DurableObjectNamespace<WineInventoryStore>;
  }
}
