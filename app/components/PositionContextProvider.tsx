import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
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

type FilterOptions = { types: string[]; countries: string[] };
type ActiveFilters = { q: string; type: string; country: string; placement: "all" | "active" | "pending" };

type PositionContext = {
  selectedWine: WineItem | undefined;
  setSelectedWine: (wine: WineItem | undefined) => void;
  selectedPosition: BottlePlacement | undefined;
  onSlotSelect: (shelf: number, layer: number, slot: number) => void;
  clearLocation: (placement: BottlePlacement) => void;
  listInventory: WineItem[];
  storage: BottlePlacements;
  inventoryByLocation: InventoryMatrix;
  activeTab: "list" | "storage";
  toggleTab: () => void;
  activeSetupId: string | null;
  filterOptions: FilterOptions;
  activeFilters: ActiveFilters;
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
  listInventory,
  placedInventory,
  storedPlacements,
  activeSetupId = null,
  filterOptions = { types: [], countries: [] },
  activeFilters = { q: "", type: "", country: "", placement: "all" as const },
}: {
  children: React.ReactNode;
  listInventory: WineItem[];
  placedInventory: WineItem[];
  storedPlacements: BottlePlacements;
  activeSetupId?: string | null;
  filterOptions?: FilterOptions;
  activeFilters?: ActiveFilters;
}) => {
  const navigate = useNavigate();
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
    const byId = new Map<string, WineItem>();
    for (const w of placedInventory) byId.set(w.iWine, w);
    for (const w of listInventory) byId.set(w.iWine, w);
    return Object.entries(storage).reduce((acc, [iWine, placements]) => {
      const wine = byId.get(iWine);
      placements.forEach(({ setupId, shelf, layer, slot }) => {
        ((acc[setupId] ??= {})[shelf] ??= {})[layer] ??= {};
        acc[setupId][shelf][layer][slot] = wine!;
      });
      return acc;
    }, {} as InventoryMatrix);
  }, [storage, listInventory, placedInventory]);

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
      const placements = storage[selectedWine.iWine];
      if (placements?.length && activeSetupId) {
        const inActiveSetup = placements.some((p) => p.setupId === activeSetupId);
        if (!inActiveSetup) {
          navigate(`/${placements[0].setupId}`);
        }
      }
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
        listInventory,
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
        filterOptions,
        activeFilters,
      }}
    >
      {children}
    </positionContext.Provider>
  );
};
