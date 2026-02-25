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
    <div>
      Shelf {selectedPosition.shelf} · Layer {selectedPosition.layer} · Slot {selectedPosition.slot}
    </div>
  );
};

const WineDisplay = ({ wine }: { wine: WineItem }) => {
  const { storage } = usePositionContext();

  const locations = storage[wine.iWine] || [];

  return (
    <div className="flex w-full justify-between p-2 bg-blue-800 gap-4 items-center">
      <div>
        <h2>
          {wine.Vintage} {wine.Wine}
        </h2>
        <p>{wine.Varietal}</p>
        <p>{wine.Region}</p>
        <p>{wine.Producer}</p>
      </div>
      <div>
        <p>
          {locations.length}/{wine.Quantity} stored
        </p>
        {locations.length > wine.Quantity && (
          <ul>
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
      className="flex border-2 border-white items-stretch gap-1"
      onClick={() => clearLocation(placement)}
    >
      <LocationBadge placement={placement} />
      <div className="bg-white/20 content-center p-1">❌</div>
    </button>
  );
};

const LocationBadge = ({ placement }: { placement: BottlePlacement }) => {
  return (
    <div className="whitespace-nowrap p-1">
      <div>Shelf: {placement.shelf}</div>
      <div>Layer: {placement.layer}</div>
      <div>Pos: {placement.slot}</div>
    </div>
  );
};
