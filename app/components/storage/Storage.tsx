import type { CSSProperties } from "react";
import type { ShelfProps } from "types";
import { Slot } from "./Slot";

export function Storage({ config }: { config: ShelfProps[] }) {
  const maxCapacity = Math.max(...config.map((shelf) => shelf.capacity));

  return (
    <ul
      className="flex flex-col justify-center-safe p-4 overflow-x-hidden overflow-y-auto"
      style={{ '--max-capacity': maxCapacity } as CSSProperties}
    >
      {config.map((shelf, index) => (
        <li key={index}>
          <Shelf options={shelf} shelfId={index + 1} />
        </li>
      ))}
    </ul>
  );
}

export function Shelf({ options, shelfId }: { options: ShelfProps; shelfId: number }) {
  return (
    <div className="shelf" style={{ '--capacity': options.capacity } as CSSProperties}>
      {Array.from({ length: options.layers ?? 1 }).map((_, index) => (
        <Layer
          {...options}
          level={index}
          shelfId={shelfId}
          layerId={index + 1}
          key={index}
        />
      )).reverse()}
    </div>
  );
}

function Layer({
  capacity,
  shelfId,
  layerId,
  level,
  innerRow,
}: {
  capacity: number;
  level: number;
  innerRow: boolean;
  shelfId: number;
  layerId: number;
}) {
  const layerCapacity = capacity - (level * (innerRow ? 2 : 1));
  const leftMissingSlots = Math.floor((capacity - layerCapacity) / 2) + 1;

  return (
    <div
      className={`row ${level % 2 === 0 ? "--even" : "--odd"} ${innerRow ? "double-row" : ""}`}
      style={{ gridColumnStart: leftMissingSlots }}
    >
      {Array.from({ length: layerCapacity }).map((_, index) => (
        <Slot shelf={shelfId} layer={layerId} slot={index + 1} key={index} />
      ))}
    </div>
  );
}
