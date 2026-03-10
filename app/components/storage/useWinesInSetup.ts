import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import type { InventoryMatrix, WineItem } from "types";

export function useWinesInSetup(winesInCurrentSetup: InventoryMatrix) {
  const fetcher = useFetcher();
  const [winesInSetup, setWinesInSetup] = useState<InventoryMatrix>(winesInCurrentSetup);

  useEffect(() => {
    setWinesInSetup(winesInCurrentSetup);
  }, [winesInCurrentSetup]);

  const placeWine = (wine: WineItem, shelf: number, layer: number, slot: number) => {
    setWinesInSetup(prev => ({
      ...prev,
      [shelf]: { ...prev[shelf], [layer]: { ...prev[shelf]?.[layer], [slot]: wine } },
    }));
    fetcher.submit(
      { intent: "add", iWine: wine.iWine, shelf: String(shelf), layer: String(layer), slot: String(slot) },
      { method: "POST" },
    );
  };

  const removeWine = (iWine: string, shelf: number, layer: number, slot: number) => {
    setWinesInSetup(prev => {
      const next = { ...prev, [shelf]: { ...prev[shelf], [layer]: { ...prev[shelf]?.[layer] } } };
      delete next[shelf][layer][slot];
      return next;
    });
    fetcher.submit(
      { intent: "remove", iWine, shelf: String(shelf), layer: String(layer), slot: String(slot) },
      { method: "POST" },
    );
  };

  const removeFromInventory = (shelf: number, layer: number, slot: number) => {
    const iWine = winesInSetup[shelf]?.[layer]?.[slot]?.iWine;
    if (iWine) removeWine(iWine, shelf, layer, slot);
  };

  return { winesInSetup, placeWine, removeWine, removeFromInventory };
}
