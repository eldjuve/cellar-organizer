import React, { useEffect } from "react";
import type { BottlePlacement, WineItem } from "types";

type AppContextType = {
  activeTab: "list" | "storage";
  toggleTab: () => void;
  setActiveTab: (tab: "list" | "storage") => void;
  selectedWine: WineItem | undefined;
  setSelectedWine: (wine: WineItem | undefined) => void;
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
  const [selectedWine, setSelectedWine] = React.useState<WineItem>();
  const [selectedPosition, setSelectedPosition] = React.useState<BottlePlacement>();

  const toggleTab = () => {
    setActiveTab((prev) => (prev === "list" ? "storage" : "list"));
  };

  useEffect(() => {
    if (selectedWine) setActiveTab("storage");
  }, [selectedWine]);

  return (
    <appContext.Provider value={{ activeTab, toggleTab, setActiveTab, selectedWine, setSelectedWine, selectedPosition, setSelectedPosition }}>
      {children}
    </appContext.Provider>
  );
};
