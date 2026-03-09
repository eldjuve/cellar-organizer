export type WineItem = {
  iWine: string;
  WineBarcode: string;
  Quantity: string;
  Pending: string;
  Size: string;
  Price: string;
  Valuation: string;
  MyValue: string;
  WBValue?: string;
  CTValue?: string;
  MenuPrice: string;
  Currency: string;
  Vintage: string;
  Wine: string;
  Locale: string;
  Country: string;
  Region: string;
  SubRegion: string;
  Appellation: string;
  Producer: string;
  SortProducer: string;
  Type: "Red" | "White" | "Rosé" | string;
  Color: "Red" | "White" | "Rosé";
  Category: string;
  Varietal: string;
  MasterVarietal: string;
  Designation: string;
  Vineyard: string;
  WA?: string;
  WS?: string;
  IWC?: string;
  BH?: string;
  AG?: string;
  WE?: string;
  JR?: string;
  RH?: string;
  JG?: string;
  GV?: string;
  JK?: string;
  LD?: string;
  CW?: string;
  WFW?: string;
  PR?: string;
  SJ?: string;
  WD?: string;
  RR?: string;
  JH?: string;
  MFW?: string;
  WWR?: string;
  IWR?: string;
  CHG?: string;
  TT?: string;
  TWF?: string;
  DR?: string;
  FP?: string;
  JM?: string;
  PG?: string;
  WAL?: string;
  JS?: string;
  CT: string;
  CNotes: string;
  MY?: string;
  PNotes?: string;
  BeginConsume: string;
  EndConsume: string;
  UPC: string;
  placements?: BottlePlacement[];
};

export type BottlePlacement = { setupId: string; shelf: number; layer: number; slot: number };
export type BottlePlacements = { [iWine: string]: BottlePlacement[] };

export type InventoryMatrix = {
  [shelf: number]: {
    [layer: number]: {
      [slot: number]: WineItem;
    };
  };
};

export type ShelfProps = {
  capacity: number;
  innerRow: boolean;
  layers?: number;
};

export type StorageSetup = ShelfProps[];

export type SetupListItem = { id: string; name: string };

// WebSocket message types — shared between worker and client

type PlacementCoords = { iWine: string; setupId: string; shelf: number; layer: number; slot: number };

export type BottlesClientMessage =
  | { type: "getInventory" }
  | ({ type: "addPlacement" } & PlacementCoords)
  | ({ type: "removePlacement" } & PlacementCoords);

export type BottlesServerMessage =
  | { type: "inventory"; data: BottlePlacements }
  | ({ type: "placementAdded" } & PlacementCoords)
  | ({ type: "placementRemoved" } & PlacementCoords)
  | { type: "ack" }
  | { type: "error"; message: string };

export type SetupsClientMessage =
  | { type: "getSetupList" }
  | { type: "getSetup"; id: string }
  | { type: "setSetup"; id: string | null; name: string; config: StorageSetup };

export type SetupsServerMessage =
  | { type: "setupList"; data: SetupListItem[] }
  | { type: "setup"; data: { name: string; config: StorageSetup } | null }
  | { type: "savedSetup"; id: string }
  | { type: "error"; message: string };

export interface Env {
  SESSION_SECRET: string;
}
