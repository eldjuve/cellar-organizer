import React from "react";
import type { WineMatrix } from "types";

type StorageContextType = {
  onSlotSelect: (shelf: number, layer: number, slot: number) => void;
  removeWineFromSlot: (shelf: number, layer: number, slot: number) => void;
  wineMatrix: WineMatrix;
};

export const StorageContext = React.createContext<StorageContextType | undefined>(undefined);

export const useStorageContext = () => {
  const ctx = React.useContext(StorageContext);
  if (!ctx) throw new Error("useStorageContext must be used within StorageView");
  return ctx;
};
