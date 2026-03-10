import { FilterBar } from "./FilterBar";
import { WineRow } from "./WineRow";
import type { WineItem } from "types";

type FilterOptions = { types: string[]; countries: string[] };
type ActiveFilters = { q: string; type: string; country: string; placement: "all" | "active" | "pending" };

export function List({ wines, filterOptions, activeFilters }: {
  wines: WineItem[];
  filterOptions: FilterOptions;
  activeFilters: ActiveFilters;
}) {
  return (
    <div className="flex flex-col h-full">
      <FilterBar filterOptions={filterOptions} activeFilters={activeFilters} listCount={wines.length} />
      <ul className="divide-y divide-ct-border overflow-y-auto flex-1">
        {wines.map((wine) => (
          <li key={wine.iWine}>
            <WineRow wine={wine} />
          </li>
        ))}
      </ul>
    </div>
  );
}
