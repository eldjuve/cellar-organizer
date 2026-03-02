import { usePositionContext } from "./PositionContextProvider";
import { FilterBar } from "./FilterBar";
import type { BottlePlacement, WineItem } from "types";

export function List() {
  const { listInventory, storage } = usePositionContext();
  return (
    <div className="flex flex-col h-full">
      <FilterBar />
      <ul className="divide-y divide-ct-border overflow-y-auto flex-1">
        {listInventory.map((wine) => (
          <li key={wine.iWine}>
            <WineRow wine={wine} locations={storage[wine.iWine] ?? []} />
          </li>
        ))}
      </ul>
    </div>
  );
}

const WineRow = ({
  wine,
  locations,
}: {
  wine: WineItem;
  locations: BottlePlacement[];
}) => {
  const { selectedPosition, selectedWine, selectWine } =
    usePositionContext();

  const quantity = Number(wine.Quantity);
  const disabled = !!(selectedPosition && locations.length === quantity);
  const isSelected = selectedWine?.iWine === wine.iWine;
  const fullyStored = locations.length === quantity;

  return (
    <button
      onClick={() => selectWine(wine)}
      disabled={disabled}
      className={`flex items-center px-3 py-2 w-full text-sm text-left transition-colors
        disabled:opacity-45 disabled:cursor-default disabled:pointer-events-none
        ${isSelected ? "bg-ct-primary-light" : "hover:bg-ct-primary-light"}`}
    >
      <div className="flex flex-col flex-1 min-w-0">
        <span className="font-medium truncate text-ct-primary">
          {wine.Vintage} {wine.Wine}
        </span>
        <span className="truncate text-ct-muted">
          {wine.Producer}
        </span>
        <span className="text-xs truncate text-ct-muted">
          CT{wine.CT ? Math.round(parseFloat(wine.CT)) : "-"} · {wine.Region} · {wine.Type}
        </span>
      </div>
      <div className="ml-3 flex items-center gap-1 shrink-0 tabular-nums text-ct-muted">
        <span>{locations.length}/{quantity}</span>
        {fullyStored ? (
          <span className="text-green-600">✓</span>
        ) : locations.length > 0 ? (
          <span className="text-ct-primary">·</span>
        ) : null}
      </div>
    </button>
  );
};
