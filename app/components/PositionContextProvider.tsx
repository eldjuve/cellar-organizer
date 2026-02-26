import React, { useEffect } from "react";
import { useFetcher } from "react-router";
import type { BottlePlacement, BottlePlacements, WineItem } from "types";

type InventoryMatrix = {
  [setupId: string]: {
    [shelf: number]: {
      [layer: number]: {
        [slot: number]: WineItem;
      };
    };
  };
};

type PositionContext = {
  selectedWine: WineItem | undefined;
  setSelectedWine: (wine: WineItem) => void;
  selectedPosition: BottlePlacement | undefined;
  onSlotSelect: (shelf: number, layer: number, slot: number) => void;
  clearLocation: (placement: BottlePlacement) => void;
  inventory: WineItem[];
  storage: BottlePlacements;
  inventoryByLocation: InventoryMatrix;
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
  const [selectedPosition, setSelectedPosition] = React.useState<BottlePlacement>();
  const [activeTab, setActiveTab] = React.useState<"list" | "storage">("list");
  const [storage, setStorage] = React.useState<BottlePlacements>(storedPlacements);

  useEffect(() => {
    setStorage(storedPlacements);
  }, [storedPlacements]);

  const inventoryByLocation = React.useMemo(() => {
    return Object.entries(storage).reduce((acc, [iWine, placements]) => {
      const wine = inventory.find((w) => w.iWine === iWine);
      placements.forEach(({ setupId, shelf, layer, slot }) => {
        ((acc[setupId] ??= {})[shelf] ??= {})[layer] ??= {};
        acc[setupId][shelf][layer][slot] = wine!;
      });
      return acc;
    }, {} as InventoryMatrix);
  }, [storage, inventory]);

  const removeFromStorage = (wine: WineItem, placement: BottlePlacement) =>
    setStorage((prev) => {
      const updated = { ...prev };
      updated[wine.iWine] = updated[wine.iWine].filter(
        (p) => !(p.setupId === placement.setupId && p.shelf === placement.shelf && p.layer === placement.layer && p.slot === placement.slot),
      );
      return updated;
    });

  const onSlotSelect = (shelf: number, layer: number, slot: number) => {
    if (!activeSetupId) return;
    const wineAtPosition = inventoryByLocation[activeSetupId]?.[shelf]?.[layer]?.[slot];
    if (wineAtPosition) {
      if (selectedWine?.iWine === wineAtPosition.iWine) {
        clearLocation({ setupId: activeSetupId, shelf, layer, slot });
      }
      setSelectedWine(wineAtPosition);
    } else if (
      selectedWine &&
      (!storage[selectedWine.iWine] ||
        Number(selectedWine.Quantity) > storage[selectedWine.iWine].length)
    ) {
      setStorage((prev) => ({
        ...prev,
        [selectedWine.iWine]: [...(prev[selectedWine.iWine] ?? []), { setupId: activeSetupId, shelf, layer, slot }],
      }));
      fetcher.submit(
        { intent: "add", iWine: selectedWine.iWine, setupId: activeSetupId, shelf, layer, slot },
        { method: "POST" },
      );
    } else {
      setSelectedPosition({ setupId: activeSetupId, shelf, layer, slot });
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

  const clearLocation = (placement: BottlePlacement) => {
    const { setupId, shelf, layer, slot } = placement;
    const wineAtPosition = inventoryByLocation[setupId]?.[shelf]?.[layer]?.[slot];
    if (wineAtPosition) {
      removeFromStorage(wineAtPosition, placement);
      fetcher.submit(
        { intent: "remove", iWine: wineAtPosition.iWine, setupId, shelf, layer, slot },
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
        onSlotSelect,
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
