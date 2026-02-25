import React, { useEffect } from "react";
import { useFetcher } from "react-router";
import type { BottlePlacements, WineItem } from "types";

type PositionContext = {
  selectedWine: WineItem | undefined;
  setSelectedWine: (wine: WineItem) => void;
  selectedPosition: string | undefined;
  onLocationSelect: (position: string) => void;
  clearLocation: (position: string) => void;
  inventory: WineItem[];
  storage: BottlePlacements;
  inventoryByLocation: { [location: string]: WineItem };
  activeTab: "list" | "storage";
  toggleTab: () => void;
  activeSetupId: string | null;
};

const positionContext = React.createContext<PositionContext | undefined>(
  undefined,
);

export const usePositionContext = () => {
  const context = React.useContext(positionContext);
  if (!context) {
    throw new Error(
      "usePositionContext must be used within a PositionProvider",
    );
  }
  return context;
};

export const PositionContextProvider = ({
  children,
  inventory,
  storedPlacements,
  activeSetupId = null,
}: {
  children: React.ReactNode;
  inventory: WineItem[];
  storedPlacements: BottlePlacements;
  activeSetupId?: string | null;
}) => {
  const fetcher = useFetcher();

  const [selectedWine, setSelectedWine] = React.useState<WineItem>();
  const [selectedPosition, setSelectedPosition] = React.useState<string>();
  const [activeTab, setActiveTab] = React.useState<"list" | "storage">("list");

  const [storage, setStorage] =
    React.useState<BottlePlacements>(storedPlacements);

  useEffect(() => {
    setStorage(storedPlacements);
  }, [storedPlacements]);

  const inventoryByLocation = React.useMemo(() => {
    return Object.entries(storage).reduce(
      (acc, [iWine, placements]) => {
        const wine = inventory.find((w) => w.iWine === iWine);
        placements.forEach(({ setupId, position }) => {
          acc[`${setupId}:${position}`] = wine!;
        });
        return acc;
      },
      {} as { [location: string]: WineItem },
    );
  }, [storage, inventory]);

  const locationKey = (position: string) => `${activeSetupId}:${position}`;

  const removeWineFromPosition = (wine: WineItem, position: string) =>
    setStorage((prev) => {
      const updated = { ...prev };
      updated[wine.iWine] = updated[wine.iWine].filter(
        (p) => !(p.setupId === activeSetupId && p.position === position),
      );
      return updated;
    });

  const onLocationSelect = (position: string) => {
    if (!activeSetupId) return;
    const wineAtPosition = inventoryByLocation[locationKey(position)];
    if (wineAtPosition) {
      setSelectedWine((cur) => {
        if (cur?.iWine === wineAtPosition.iWine) {
          removeWineFromPosition(cur, position);
        }
        return wineAtPosition;
      });
    } else if (
      selectedWine &&
      (!storage[selectedWine.iWine] ||
        selectedWine.Quantity > storage[selectedWine.iWine].length)
    ) {
      const placements = [
        ...(storage[selectedWine.iWine] ?? []),
        { setupId: activeSetupId, position },
      ];
      setStorage((prev) => ({
        ...prev,
        [selectedWine.iWine]: placements,
      }));
      fetcher.submit(
        { iWine: selectedWine.iWine, locations: JSON.stringify(placements) },
        { method: "POST" },
      );
    } else {
      setSelectedPosition(position);
      setSelectedWine(undefined);
    }
  };

  useEffect(() => {
    if (selectedWine) {
      setActiveTab("storage");
    }
  }, [selectedWine]);

  const toggleTab = () => {
    setActiveTab((prev) => (prev === "list" ? "storage" : "list"));
  };

  const clearLocation = (position: string) => {
    if (!activeSetupId) return;
    const wineAtPosition = inventoryByLocation[locationKey(position)];
    if (wineAtPosition) {
      removeWineFromPosition(wineAtPosition, position);
      const placements = storedPlacements[wineAtPosition.iWine].filter(
        (p) => !(p.setupId === activeSetupId && p.position === position),
      );
      fetcher.submit(
        { iWine: wineAtPosition.iWine, locations: JSON.stringify(placements) },
        { method: "POST" },
      );
    }
  };

  return (
    <positionContext.Provider
      value={{
        inventory,
        storage,
        selectedWine,
        setSelectedWine,
        selectedPosition,
        onLocationSelect,
        clearLocation,
        inventoryByLocation,
        activeTab,
        toggleTab,
        activeSetupId,
      }}
    >
      {children}
    </positionContext.Provider>
  );
};
