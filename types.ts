export type WineItem = {
  iWine: string;
  WineBarcode: string;
  Quantity: number;
  Pending: string;
  Size: string;
  Price: string;
  Valuation: string;
  MyValue: string;
  WBValue?: string | null;
  CTValue?: string | null;
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
  Ratings?: {
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
  };
  CT: string;
  CNotes: string;
  MY?: string;
  PNotes?: string;
  BeginConsume: string;
  EndConsume: string;
  UPC: string;
};

export type BottlePlacements = { [iWine: string]: string[] };

export type WineLocation = WineItem & { positions: string[] };

export type ShelfProps = {
  capacity: number;
  innerRow: boolean;
  layers?: number;
};

export type StorageSetup = ShelfProps[];

export type StorageSetupOverview = { [name: string]: StorageSetup };

export interface Env {
  SESSION_SECRET: string;
}
