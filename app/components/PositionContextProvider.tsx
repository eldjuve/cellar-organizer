import React, { useEffect, useRef } from "react";
import type { BottlePlacement, BottlePlacements, BottlesClientMessage, BottlesServerMessage, WineItem } from "types";

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
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${protocol}//${window.location.host}/ws/bottles`;
    let closed = false;
    let ws: WebSocket;

    const connect = () => {
      ws = new WebSocket(url);
      wsRef.current = ws;
      ws.onmessage = (event) => {
        try {
          const msg: BottlesServerMessage = JSON.parse(event.data);
          if (msg.type === "placementAdded") {
            setStorage((prev) => ({
              ...prev,
              [msg.iWine]: [...(prev[msg.iWine] ?? []), { setupId: msg.setupId, shelf: msg.shelf, layer: msg.layer, slot: msg.slot }],
            }));
          } else if (msg.type === "placementRemoved") {
            setStorage((prev) => {
              const updated = { ...prev };
              updated[msg.iWine] = (updated[msg.iWine] ?? []).filter(
                (p) => !(p.setupId === msg.setupId && p.shelf === msg.shelf && p.layer === msg.layer && p.slot === msg.slot),
              );
              return updated;
            });
          }
        } catch { /* ignore malformed messages */ }
      };
      ws.onclose = () => { if (!closed) setTimeout(connect, 2000); };
    };
    connect();

    return () => { closed = true; ws?.close(); };
  }, []);

  const send = (msg: BottlesClientMessage) => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
  };

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
      send({ type: "addPlacement", iWine: selectedWine.iWine, setupId: activeSetupId, shelf, layer, slot });
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
      send({ type: "removePlacement", iWine: wineAtPosition.iWine, setupId, shelf, layer, slot });
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
