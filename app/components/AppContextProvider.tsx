import React, { useEffect } from "react";
import { useFetcher } from "react-router";
import type { BottlePlacement, WineItem } from "types";

type AppContextType = {
  activeTab: "list" | "storage";
  toggleTab: () => void;
  setActiveTab: (tab: "list" | "storage") => void;
  selectedWine: WineItem | undefined;
  setSelectedWineId: (id: string | undefined) => void;
  selectedPosition: BottlePlacement | undefined;
  setSelectedPosition: (position: BottlePlacement | undefined) => void;
};

const appContext = React.createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = React.useContext(appContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppContextProvider");
  }
  return context;
};

export const AppContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeTab, setActiveTab] = React.useState<"list" | "storage">("list");
  const [selectedWineId, setSelectedWineId] = React.useState<string | undefined>();
  const [selectedPosition, setSelectedPosition] = React.useState<BottlePlacement>();
  const fetcher = useFetcher<{ wine: WineItem | null }>();

  const toggleTab = () => {
    setActiveTab((prev) => (prev === "list" ? "storage" : "list"));
  };

  useEffect(() => {
    if (selectedWineId) setActiveTab("storage");
  }, [selectedWineId]);

  useEffect(() => {
    if (selectedWineId) {
      fetcher.load(`/api/wine?iWine=${selectedWineId}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWineId]);

  const selectedWine = selectedWineId ? (fetcher.data?.wine ?? undefined) : undefined;

  return (
    <appContext.Provider value={{ activeTab, toggleTab, setActiveTab, selectedWine, setSelectedWineId, selectedPosition, setSelectedPosition }}>
      {children}
    </appContext.Provider>
  );
};
