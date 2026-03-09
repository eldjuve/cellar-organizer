import { useAppContext } from "./AppContextProvider";
import { FilterBar } from "./FilterBar";
import type { WineItem } from "types";

type FilterOptions = { types: string[]; countries: string[] };
type ActiveFilters = { q: string; type: string; country: string; placement: "all" | "active" | "pending" };

export function List({ listInventory, filterOptions, activeFilters }: {
  listInventory: WineItem[];
  filterOptions: FilterOptions;
  activeFilters: ActiveFilters;
}) {
  return (
    <div className="flex flex-col h-full">
      <FilterBar filterOptions={filterOptions} activeFilters={activeFilters} listCount={listInventory.length} />
      <ul className="divide-y divide-ct-border overflow-y-auto flex-1">
        {listInventory.map((wine) => (
          <li key={wine.iWine}>
            <WineRow wine={wine} />
          </li>
        ))}
      </ul>
    </div>
  );
}

const WineRow = ({
  wine,
}: {
  wine: WineItem;
}) => {
  const { selectedWine, setSelectedWineId, selectedPosition, setSelectedPosition } = useAppContext();

  const locations = wine.placements ?? [];
  const quantity = Number(wine.Quantity);
  const disabled = !!(selectedPosition && locations.length === quantity);
  const isSelected = selectedWine?.iWine === wine.iWine;
  const fullyStored = locations.length === quantity;

  const handleClick = () => {
    if (selectedPosition) setSelectedPosition(undefined);
    setSelectedWineId(wine.iWine);
  };

  return (
    <button
      onClick={handleClick}
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
