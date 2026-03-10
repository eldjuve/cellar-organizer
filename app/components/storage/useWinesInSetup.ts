import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import type { WineMatrix, WineItem } from "types";
import { clientId } from "~/clientId";

export function useWinesInSetup(winesInCurrentSetup: WineMatrix) {
  const fetcher = useFetcher();
  const [wineMatrix, setWineMatrix] = useState<WineMatrix>(winesInCurrentSetup);

  useEffect(() => {
    setWineMatrix(winesInCurrentSetup);
  }, [winesInCurrentSetup]);

  const placeWine = (wine: WineItem, shelf: number, layer: number, slot: number) => {
    setWineMatrix(prev => ({
      ...prev,
      [shelf]: { ...prev[shelf], [layer]: { ...prev[shelf]?.[layer], [slot]: wine } },
    }));
    fetcher.submit(
      { intent: "add", iWine: wine.iWine, shelf: String(shelf), layer: String(layer), slot: String(slot), clientId },
      { method: "POST" },
    );
  };

  const removeWine = (iWine: string, shelf: number, layer: number, slot: number) => {
    setWineMatrix(prev => {
      const next = { ...prev, [shelf]: { ...prev[shelf], [layer]: { ...prev[shelf]?.[layer] } } };
      delete next[shelf][layer][slot];
      return next;
    });
    fetcher.submit(
      { intent: "remove", iWine, shelf: String(shelf), layer: String(layer), slot: String(slot), clientId },
      { method: "POST" },
    );
  };

  return { wineMatrix, placeWine, removeWine };
}
