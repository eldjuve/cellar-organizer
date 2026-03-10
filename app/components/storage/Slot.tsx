import { useEffect, useRef } from "react";
import { useAppContext } from "../AppContextProvider";
import { useStorageContext } from "./StorageContext";

export function Slot({ shelf, layer, slot }: { shelf: number; layer: number; slot: number }) {
  const { onSlotSelect, wineMatrix } = useStorageContext();
  const { selectedWine, selectedPosition } = useAppContext();

  const wine = wineMatrix[shelf]?.[layer]?.[slot];

  const isSelected =  (selectedPosition?.shelf === shelf && selectedPosition?.layer === layer && selectedPosition?.slot === slot)
  || (selectedWine !== undefined && selectedWine.iWine === wine?.iWine);

  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isSelected) {
      buttonRef.current?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    }
  }, [isSelected]);

  const handleSelect = () => {
    onSlotSelect(shelf, layer, slot);
  };

  return (
    <div className="slot">
      <button
        ref={buttonRef}
        className="slot-button"
        data-color={wine?.Color}
        data-selected={isSelected || undefined}
        onClick={handleSelect}
      ></button>
    </div>
  );
}
