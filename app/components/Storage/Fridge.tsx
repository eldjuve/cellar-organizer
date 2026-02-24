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
      {shelfs.map((layers, index) => (
        <Shelf options={layers} id={index + 1} key={index}  maxCapacity={maxCapacity}/>
      ))}
    </ul>
  );
}

export function Shelf({ options, id, maxCapacity }: { options: ShelfProps; id: number; maxCapacity: number }) {
  return (
    <li className="shelf-container">
      <div className={`shelf`} style={{gridTemplateColumns: `repeat(${maxCapacity},minmax(1rem,1fr))`}}>
        {Array.from({ length: options.layers ?? 1 }).map((_, index) => (
          <Layer
            {...options}
            level={index}
            id={`${id}.${index + 1}`}
            key={index}
          />
        )).reverse()}
      </div>
    </li>

  );
}

function Layer({
  capacity,
  id,
  level,
  innerRow,
}: {
  capacity: number;
  level: number;
  innerRow: boolean;
  id: string;
}) {
  const layerCapacity = capacity - (level * (innerRow ? 2 : 1));
  const leftMissingSlots = Math.floor((capacity - layerCapacity) / 2) + 1;

  return (
    <div 
      className={`row ${level % 2 === 0 ? "--even" : "--odd"} ${innerRow ? "double-row" : ""}`} 
      style={{gridColumnStart: leftMissingSlots}}
    >
      {Array.from({ length: layerCapacity }).map((item, index) => (
        <Slot id={`${id}.${index + 1}`} key={index} />
      ))}
    </div>
  );
}

function Slot({ id }: { id: string }) {
  const { onLocationSelect, inventoryByLocation, selectedWine } =
    usePositionContext();

  const wine = inventoryByLocation[id];

  if (wine) {
    console.log("Wine at", id, "is", wine.Wine);
  }

  const handleSelect = () => {
    onLocationSelect(id);
  };

  const colorVariants: { [key in typeof wine.Color]: string } = {
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
    <div
      className={`slot  border-2 border-transparent grow-2 aspect-square`}
    ></div>
  );
}
