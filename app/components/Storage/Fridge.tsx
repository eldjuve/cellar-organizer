import type { ShelfProps } from "types";
import { usePositionContext } from "../PositionContextProvider";

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
    <ul className="flex flex-col justify-center p-4 overflow-x-auto">
      {shelfs.map((shelf, index) => (
        <Shelf options={shelf} shelfId={index + 1} key={index} maxCapacity={maxCapacity} />
      ))}
    </ul>
  );
}

export function Shelf({ options, shelfId, maxCapacity }: { options: ShelfProps; shelfId: number; maxCapacity: number }) {
  return (
    <li className="shelf-container">
      <div className="shelf" style={{ gridTemplateColumns: `repeat(${maxCapacity},minmax(1rem,1fr))` }}>
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
    </li>
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
  const { onSlotSelect, inventoryByLocation, selectedWine, activeSetupId } =
    usePositionContext();

  const wine = inventoryByLocation[`${activeSetupId}:${shelf}.${layer}.${slot}`];

  const handleSelect = () => {
    onSlotSelect(shelf, layer, slot);
  };

  const colorVariants: { [key in "Red" | "White" | "Rosé"]: string } = {
    Red: "bg-red-400",
    White: "bg-yellow-200",
    Rosé: "bg-pink-300",
  };

  return (
    <div className="slot">
      <button
        className={`${wine ? colorVariants[wine.Color] : "bg-white"} ${selectedWine && selectedWine.iWine === wine?.iWine ? "border-4 border-blue-400" : ""}`}
        onClick={handleSelect}
      ></button>
    </div>
  );
}

function BlindSlot() {
  return (
    <div className="slot border-2 border-transparent grow-2 aspect-square"></div>
  );
}
