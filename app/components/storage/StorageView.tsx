import React, { useEffect } from "react";
import { useFetcher, useRevalidator } from "react-router";
import type { StorageConfigMessage, WineMatrix, ShelfProps } from "types";
import { useAppContext } from "../AppContextProvider";
import { useWinesInConfig } from "./useWinesInConfig";
import { Storage } from "./Storage";
import { Display } from "./Selected";
import { clientId } from "~/clientId";
import { StorageContext } from "./StorageContext";
export { StorageContext } from "./StorageContext";


function useConfigSync() {
  const revalidator = useRevalidator();
  useEffect(() => {
    const es = new EventSource(`/sse/configs?clientId=${clientId}`);
    es.onmessage = (e) => {
      const msg = JSON.parse(e.data) as StorageConfigMessage;
      if (msg.type === "configListChanged") revalidator.revalidate();
    };
    es.onopen = () => revalidator.revalidate();
    return () => es.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export function StorageView({ configId, config, wineMatrix: winesInCurrentSetup }: { configId: string; config?: ShelfProps[]; wineMatrix: WineMatrix }) {
  useConfigSync();
  const { selectedWine, setSelectedWineId, setSelectedPosition, selectedPosition } = useAppContext();
  const fetcher = useFetcher();

  const { wineMatrix, placeWine, removeWine } = useWinesInConfig(winesInCurrentSetup);

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
        setSelectedPosition({ configId, shelf, layer, slot });
        setSelectedWineId(undefined);
        return;
      }
      placeWine(selectedWine, shelf, layer, slot);
    } else {
      setSelectedPosition({ configId, shelf, layer, slot });
      setSelectedWineId(undefined);
    }
  };

  return (
    <StorageContext.Provider value={{ wineMatrix, onSlotSelect, removeWineFromSlot }}>
      <div className="grow grid rounded border border-ct-border bg-ct-surface overflow-hidden">
        <Storage config={config} />
        <Display />
      </div>
    </StorageContext.Provider>
  );
}
