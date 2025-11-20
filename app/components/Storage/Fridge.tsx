import { usePositionContext } from "../PositionContextProvider";
import { Dump } from "./Dump";

export type ShelfProps = {
  capacity: number;
  innerRow: boolean;
  layers?: number;
};

const defaultConfig = [
  { capacity: 16, innerRow: true, layers: 2 },
  { capacity: 16, innerRow: true },
  { capacity: 16, innerRow: true },
  { capacity: 16, innerRow: true },
  { capacity: 16, innerRow: true },
  { capacity: 16, innerRow: true },
  { capacity: 7, innerRow: false },
  { capacity: 7, innerRow: false },
];

export function Fridge({ config }: { config?: ShelfProps[] }) {
  const shelfs = config ?? defaultConfig;

  return (
    <ul className="flex flex-col justify-center p-4 overflow-x-auto">
      {shelfs.map((layers, index) => (
        <Shelf options={layers} id={index + 1} key={index} />
      ))}
    </ul>
  );
}

export function Shelf({ options, id }: { options: ShelfProps; id: number }) {
  return (
    <li className="shelf flex flex-col-reverse w-full border-b-2 mb-1 pb-1 border-amber-600 items-center">
      {Array.from({ length: options.layers ?? 1 }).map((_, index) => (
        <Layer
          {...options}
          level={index}
          id={`${id}.${index + 1}`}
          key={index}
        />
      ))}
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
  const layerCapacity = capacity - (level* (innerRow ? 2 : 1));

  return (
    <div className={`row ${innerRow ? "double-row" : ""}`}>
      {Array.from({ length: level }).map((_, index) => (
        <BlindSlot key={index} />
      ))}
      {Array.from({ length: layerCapacity }).map((item, index) => (
        <Slot id={`${id}.${index + 1}`} key={index} />
      ))}
      {innerRow && Array.from({ length: level }).map((_, index) => (
        <BlindSlot key={index} />
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
    <button
      className={`slot min-w-6 max-w-10 grow-2 aspect-square border-2 border-black rounded-full text-black ${wine ? colorVariants[wine.Color] : "bg-white"} ${selectedWine && selectedWine.iWine === wine?.iWine ? "border-4 border-blue-400" : ""}`}
      onClick={handleSelect}
    ></button>
  );
}

function BlindSlot() {
  return <div className={`slot min-w-3 max-w-10 border-2 border-transparent grow-2 aspect-square`}></div>;
}
