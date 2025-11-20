import type { WineItem } from "types";
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

  return <div>{selectedPosition}</div>;
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
        {locations.length > parseInt(wine.Quantity) && (
          <ul>
            {locations.map((location) => (
              <li key={location}>
                <LocationDeselector location={location} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const LocationDeselector = ({ location }: { location: string }) => {
  const { clearLocation } = usePositionContext();

  return (
    <button
      className="flex border-2 border-white items-stretch gap-1"
      onClick={() => clearLocation(location)}
    >
      <LocationBadge location={location} />
      <div className="bg-white/20 content-center p-1">❌</div>
    </button>
  );
};

const LocationBadge = ({ location }: { location: string }) => {
  if (location === "dump") {
    return (
      <div className="whitespace-nowrap p-1">
        <div>Off-shelf</div>
      </div>
    );
  }

  const [shelf, layer, position] = location.split(".");

  return (
    <div className="whitespace-nowrap p-1">
      <div>Shelf: {shelf}</div>
      <div>Layer: {layer}</div>
      <div>Pos: {position}</div>
    </div>
  );
};
