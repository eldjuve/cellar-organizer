import type { BottlePlacement, WineItem } from "types";
import { usePositionContext } from "../PositionContextProvider";

export function Display() {
  const { selectedWine } = usePositionContext();

  if (!selectedWine) {
    return <WinePosition />;
  }

  return <WineDisplay wine={selectedWine} />;
}

const WinePosition = () => {
  const { selectedPosition } = usePositionContext();

  if (!selectedPosition) return null;

  return (
    <div className="px-4 py-3 text-sm border-t border-ct-border text-ct-muted">
      Shelf {selectedPosition.shelf} · Layer {selectedPosition.layer} · Slot {selectedPosition.slot}
    </div>
  );
};

const WineDisplay = ({ wine }: { wine: WineItem }) => {
  const { storage } = usePositionContext();

  const locations = storage[wine.iWine] || [];

  return (
    <div className="flex w-full justify-between px-4 py-3 gap-4 items-start border-t-2 border-ct-primary bg-ct-primary-light">
      <div className="min-w-0">
        <h2 className="font-semibold text-sm text-ct-primary">
          {wine.Vintage} {wine.Wine}
        </h2>
        <p className="text-xs mt-0.5 text-ct-muted">
          {wine.Varietal} · {wine.Region}
        </p>
        <p className="text-xs text-ct-muted">{wine.Producer}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-medium tabular-nums text-ct-text">
          {locations.length}/{Number(wine.Quantity)} stored
        </p>
        {locations.length > 0 && (
          <ul className="mt-1 space-y-1">
            {locations.map((placement) => (
              <li key={`${placement.setupId}:${placement.shelf}.${placement.layer}.${placement.slot}`}>
                <LocationDeselector placement={placement} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const LocationDeselector = ({ placement }: { placement: BottlePlacement }) => {
  const { clearLocation } = usePositionContext();

  return (
    <button
      className="flex items-center gap-1 rounded border border-ct-border bg-ct-surface text-ct-muted text-xs px-2 py-0.5 hover:border-ct-primary transition-colors"
      onClick={() => clearLocation(placement)}
    >
      <LocationBadge placement={placement} />
      <span className="text-ct-primary">×</span>
    </button>
  );
};

const LocationBadge = ({ placement }: { placement: BottlePlacement }) => {
  return (
    <span className="whitespace-nowrap">
      S{placement.shelf} · L{placement.layer} · P{placement.slot}
    </span>
  );
};
