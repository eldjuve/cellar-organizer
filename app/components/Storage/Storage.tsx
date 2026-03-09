import React, { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import { Fridge } from "./Fridge";
import { Display } from "./Selected";
import type { InventoryMatrix, ShelfProps } from "types";
import { useAppContext } from "../AppContextProvider";


type StorageContextType = {
  onSlotSelect: (shelf: number, layer: number, slot: number) => void;
  removeFromInventory: (shelf: number, layer: number, slot: number) => void;
  inventory: InventoryMatrix;
};

const StorageContext = React.createContext<StorageContextType | undefined>(undefined);

export const useStorageContext = () => {
  const ctx = React.useContext(StorageContext);
  if (!ctx) throw new Error("useStorageContext must be used within StorageView");
  return ctx;
};


export function StorageView({ setupId, config, winesInCurrentSetup }: { setupId: string; config?: ShelfProps[]; winesInCurrentSetup: InventoryMatrix }) {
  const { selectedWine, setSelectedWine, setSelectedPosition } = useAppContext();
  const fetcher = useFetcher();

  const [winesInSetup, setWinesInSetup] = useState<InventoryMatrix>(winesInCurrentSetup);

  useEffect(() => {
    setWinesInSetup(winesInCurrentSetup);
  }, [winesInCurrentSetup]);


  const removeFromInventory = (shelf: number, layer: number, slot: number) => {
    const iWine = winesInSetup[shelf]?.[layer]?.[slot]?.iWine;
    setWinesInSetup(prev => {
      const next = { ...prev, [shelf]: { ...prev[shelf], [layer]: { ...prev[shelf]?.[layer] } } };
      delete next[shelf][layer][slot];
      return next;
    });
    if (iWine) {
      fetcher.submit(
        { intent: "remove", iWine, shelf: String(shelf), layer: String(layer), slot: String(slot) },
        { method: "POST" },
      );
    }
  };

  const onSlotSelect = (shelf: number, layer: number, slot: number) => {
    const wineAtPosition = winesInSetup[shelf]?.[layer]?.[slot];
    if (wineAtPosition) {
      if (selectedWine?.iWine === wineAtPosition.iWine) {
        setWinesInSetup(prev => {
          const next = { ...prev };
          delete next[shelf][layer][slot];
          return next;
        });
        fetcher.submit(
          { intent: "remove", iWine: wineAtPosition.iWine, shelf: String(shelf), layer: String(layer), slot: String(slot) },
          { method: "POST" },
        );
      }
      setSelectedWine(wineAtPosition);
    } else if (selectedWine) {
      setWinesInSetup(prev => ({
        ...prev,
        [shelf]: { ...prev[shelf], [layer]: { ...prev[shelf]?.[layer], [slot]: selectedWine } },
      }));
      fetcher.submit(
        { intent: "add", iWine: selectedWine.iWine, shelf: String(shelf), layer: String(layer), slot: String(slot) },
        { method: "POST" },
      );
    } else {
      setSelectedPosition({ setupId, shelf, layer, slot });
      setSelectedWine(undefined);
    }
  };

  return (
    <StorageContext.Provider value={{ inventory: winesInSetup, onSlotSelect, removeFromInventory }}>
      <div className="grow grid rounded border border-ct-border bg-ct-surface overflow-hidden">
        <Fridge config={config} />
        <Display />
      </div>
    </StorageContext.Provider>
  );
}
