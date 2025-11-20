import { usePositionContext } from "./PositionContextProvider";
import { useFetcher } from "react-router";
import type { WineItem } from "types";

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
  locations: string[];
}) => {
  const fetcher = useFetcher();
  const { selectedPosition, selectedWine, setSelectedWine } =
    usePositionContext();

  const loading = fetcher.state !== "idle";

  const disabled = selectedPosition && locations.length === wine.Quantity;

  return (
    <button
      onClick={() => setSelectedWine(wine)}
      disabled={disabled || loading}
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
        {locations.length}/{wine.Quantity}
        {locations.length == wine.Quantity ? (
          <span className="ml-2 text-green-400">✔️</span>
        ) : locations.length < wine.Quantity ? (
          <span className="ml-2 text-yellow-400">➕</span>
        ) : (
          <span className="ml-2 text-red-400">❌</span>
        )}
      </div>
    </button>
  );
};
