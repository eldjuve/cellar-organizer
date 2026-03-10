import type { CSSProperties } from "react";
import type { ShelfProps } from "types";
import { useAppContext } from "../AppContextProvider";
import { useStorageContext } from "./Storage";

const defaultConfig = [
  { capacity: 12, innerRow: true, layers: 2 },
  { capacity: 12, innerRow: true },
  { capacity: 12, innerRow: true },
  { capacity: 12, innerRow: true },
  { capacity: 12, innerRow: true },
  { capacity: 12, innerRow: true },
  { capacity: 6, innerRow: false },
  { capacity: 6, innerRow: false },
];

export function Fridge({ config }: { config?: ShelfProps[] }) {
  const shelfs = config ?? defaultConfig;
  const maxCapacity = Math.max(...shelfs.map((shelf) => shelf.capacity));

  return (
    <ul
      className="flex flex-col justify-center-safe p-4 overflow-x-hidden overflow-y-auto"
      style={{ '--max-capacity': maxCapacity } as CSSProperties}
    >
      {shelfs.map((shelf, index) => (
        <li key={index}>
          <Shelf options={shelf} shelfId={index + 1} />
        </li>
      ))}
    </ul>
  );
}

export function Shelf({ options, shelfId }: { options: ShelfProps; shelfId: number }) {
  return (
    <div className="shelf" style={{ '--capacity': options.capacity } as CSSProperties}>
      {Array.from({ length: options.layers ?? 1 }).map((_, index) => (
        <Layer
          {...options}
          level={index}
          shelfId={shelfId}
          layerId={index + 1}
          key={index}
        />
      )).reverse()}
    </div>
  );
}

function Layer({
  capacity,
  shelfId,
  layerId,
  level,
  innerRow,
}: {
  capacity: number;
  level: number;
  innerRow: boolean;
  shelfId: number;
  layerId: number;
}) {
  const layerCapacity = capacity - (level * (innerRow ? 2 : 1));
  const leftMissingSlots = Math.floor((capacity - layerCapacity) / 2) + 1;

  return (
    <div
      className={`row ${level % 2 === 0 ? "--even" : "--odd"} ${innerRow ? "double-row" : ""}`}
      style={{ gridColumnStart: leftMissingSlots }}
    >
      {Array.from({ length: layerCapacity }).map((_, index) => (
        <Slot shelf={shelfId} layer={layerId} slot={index + 1} key={index} />
      ))}
    </div>
  );
}

function Slot({ shelf, layer, slot }: { shelf: number; layer: number; slot: number }) {
  const { onSlotSelect, wineMatrix } = useStorageContext();
  const { selectedWine } = useAppContext();

  const wine = wineMatrix[shelf]?.[layer]?.[slot];

  const handleSelect = () => {
    onSlotSelect(shelf, layer, slot);
  };

  return (
    <div className="slot">
      <button
        className="slot-button"
        data-color={wine?.Color}
        data-selected={(selectedWine !== undefined && selectedWine.iWine === wine?.iWine) || undefined}
        onClick={handleSelect}
      ></button>
    </div>
  );
}
