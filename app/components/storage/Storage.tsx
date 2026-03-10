import React, { useEffect } from "react";
import { useFetcher, useRevalidator } from "react-router";
import type { SetupMessage, WineMatrix, ShelfProps } from "types";
import { useAppContext } from "../AppContextProvider";
import { useWinesInSetup } from "./useWinesInSetup";
import { Fridge } from "./Fridge";
import { Display } from "./Selected";
import { clientId } from "~/clientId";


type StorageContextType = {
  onSlotSelect: (shelf: number, layer: number, slot: number) => void;
  removeWineFromSlot: (shelf: number, layer: number, slot: number) => void;
  wineMatrix: WineMatrix;
};

const StorageContext = React.createContext<StorageContextType | undefined>(undefined);

export const useStorageContext = () => {
  const ctx = React.useContext(StorageContext);
  if (!ctx) throw new Error("useStorageContext must be used within StorageView");
  return ctx;
};


function useSetupsSync() {
  const revalidator = useRevalidator();
  useEffect(() => {
    const es = new EventSource(`/sse/setups?clientId=${clientId}`);
    es.onmessage = (e) => {
      const msg = JSON.parse(e.data) as SetupMessage;
      if (msg.type === "setupListChanged") revalidator.revalidate();
    };
    es.onopen = () => revalidator.revalidate();
    return () => es.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export function StorageView({ setupId, config, wineMatrix: winesInCurrentSetup }: { setupId: string; config?: ShelfProps[]; wineMatrix: WineMatrix }) {
  useSetupsSync();
  const { selectedWine, setSelectedWineId, setSelectedPosition, selectedPosition } = useAppContext();
  const fetcher = useFetcher();

  const { wineMatrix, placeWine, removeWine } = useWinesInSetup(winesInCurrentSetup);

  useEffect(() => {
    if (!selectedWine || !selectedPosition) return;
    const { shelf, layer, slot } = selectedPosition;
    if (wineMatrix[shelf]?.[layer]?.[slot]) return; // slot occupied
    if ((selectedWine.placements?.length ?? 0) >= Number(selectedWine.Quantity)) return; // fully placed
    placeWine(selectedWine, shelf, layer, slot);
    setSelectedPosition(undefined);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWine]);


  const removeWineFromSlot = (shelf: number, layer: number, slot: number) => {
    const iWine = wineMatrix[shelf]?.[layer]?.[slot]?.iWine;
    if (iWine) removeWine(iWine, shelf, layer, slot);
  };

  const onSlotSelect = (shelf: number, layer: number, slot: number) => {
    const wineAtPosition = wineMatrix[shelf]?.[layer]?.[slot];
    if (wineAtPosition) {
      if (selectedWine?.iWine === wineAtPosition.iWine) {
        removeWine(wineAtPosition.iWine, shelf, layer, slot);
      }
      setSelectedWineId(wineAtPosition.iWine);
    } else if (selectedWine) {
      if ((selectedWine.placements?.length ?? 0) >= Number(selectedWine.Quantity)) {
        setSelectedPosition({ setupId, shelf, layer, slot });
        setSelectedWineId(undefined);
        return;
      }
      placeWine(selectedWine, shelf, layer, slot);
    } else {
      setSelectedPosition({ setupId, shelf, layer, slot });
      setSelectedWineId(undefined);
    }
  };

  return (
    <StorageContext.Provider value={{ wineMatrix, onSlotSelect, removeWineFromSlot }}>
      <div className="grow grid rounded border border-ct-border bg-ct-surface overflow-hidden">
        <Fridge config={config} />
        <Display />
      </div>
    </StorageContext.Provider>
  );
}
