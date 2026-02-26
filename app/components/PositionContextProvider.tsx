import React, { useEffect } from "react";
import { useFetcher } from "react-router";
import type { BottlePlacement, BottlePlacements, WineItem } from "types";

type PositionContext = {
  selectedWine: WineItem | undefined;
  setSelectedWine: (wine: WineItem) => void;
  selectedPosition: BottlePlacement | undefined;
  onSlotSelect: (shelf: number, layer: number, slot: number) => void;
  onDump: () => void;
  clearLocation: (placement: BottlePlacement) => void;
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

const placementKey = (setupId: string, shelf: number, layer: number, slot: number) =>
  `${setupId}:${shelf}.${layer}.${slot}`;

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
    return Object.entries(storage).reduce(
      (acc, [iWine, placements]) => {
        const wine = inventory.find((w) => w.iWine === iWine);
        placements.forEach(({ setupId, shelf, layer, slot }) => {
          acc[placementKey(setupId, shelf, layer, slot)] = wine!;
        });
        return acc;
      },
      {} as { [location: string]: WineItem },
    );
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
    const key = placementKey(activeSetupId, shelf, layer, slot);
    const wineAtPosition = inventoryByLocation[key];
    if (wineAtPosition) {
      setSelectedWine((cur) => {
        if (cur?.iWine === wineAtPosition.iWine) {
          removeFromStorage(cur, { setupId: activeSetupId, shelf, layer, slot });
        }
        return wineAtPosition;
      });
    } else if (
      selectedWine &&
      (!storage[selectedWine.iWine] ||
        selectedWine.Quantity > storage[selectedWine.iWine].length)
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

  const onDump = () => {
    // off-shelf placement — handled separately from shelf slots
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
    const wineAtPosition = inventoryByLocation[placementKey(setupId, shelf, layer, slot)];
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
        onDump,
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
