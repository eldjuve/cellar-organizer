import { usePositionContext } from "./PositionContextProvider";
import type { BottlePlacement, WineItem } from "types";

export function List() {
  const { inventory, storage } = usePositionContext();
  return (
    <ul>
      {inventory.map((wine) => (
        <li key={wine.iWine} className="even:bg-gray-100/5">
          <WineRow wine={wine} locations={storage[wine.iWine] ?? []} />
        </li>
      ))}
    </ul>
  );
}

const WineRow = ({
  wine,
  locations,
}: {
  wine: WineItem;
  locations: BottlePlacement[];
}) => {
  const { selectedPosition, selectedWine, setSelectedWine } =
    usePositionContext();

  const quantity = Number(wine.Quantity);
  const disabled = selectedPosition && locations.length === quantity;

  return (
    <button
      onClick={() => setSelectedWine(wine)}
      disabled={disabled}
      className="flex items-center p-1 w-full hover:bg-blue-600 text-sm"
    >
      <div className="flex flex-col w-full">
        <div className="text-blue-400 font-medium text-left">
          <span>
            {wine.Vintage} {wine.Wine}
          </span>
        </div>
        <div className="flex flex-col text-sm text-left">
          <span>{wine.Producer}</span>
          <span>
            CT{Math.round(parseFloat(wine.CT))} {wine.Region} {wine.Type}
          </span>
        </div>
      </div>
      <div>
        {locations.length}/{quantity}
        {locations.length === quantity ? (
          <span className="ml-2 text-green-400">✔️</span>
        ) : locations.length < quantity ? (
          <span className="ml-2 text-yellow-400">➕</span>
        ) : (
          <span className="ml-2 text-red-400">❌</span>
        )}
      </div>
    </button>
  );
};
