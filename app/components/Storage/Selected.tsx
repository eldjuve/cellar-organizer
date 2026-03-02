import React from "react";
import type { BottlePlacement, WineItem } from "types";
import { usePositionContext } from "../PositionContextProvider";
import { BarcodeScanner } from "../BarcodeScanner";

export function Display() {
  const { selectedWine } = usePositionContext();

  if (!selectedWine) {
    return <WinePosition />;
  }

  return <WineDisplay wine={selectedWine} />;
}

const WinePosition = () => {
  const { selectedPosition, setSelectedWine } = usePositionContext();
  const [scanning, setScanning] = React.useState(false);

  if (!selectedPosition) return null;

  return (
    <div className="px-4 py-3 text-sm border-t border-ct-border text-ct-muted flex items-center justify-between gap-2">
      <span>Shelf {selectedPosition.shelf} · Layer {selectedPosition.layer} · Slot {selectedPosition.slot}</span>
      <button
        onClick={() => setScanning(true)}
        className="shrink-0 flex items-center gap-1 rounded border border-ct-border bg-ct-surface text-ct-muted text-xs px-2 py-1 hover:border-ct-primary hover:text-ct-primary transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
          <path d="M3 7V5a2 2 0 0 1 2-2h2" />
          <path d="M17 3h2a2 2 0 0 1 2 2v2" />
          <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
          <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
          <line x1="7" y1="12" x2="7" y2="12" />
          <line x1="12" y1="7" x2="12" y2="17" />
          <line x1="17" y1="12" x2="17" y2="12" />
          <rect x="9" y="7" width="6" height="10" rx="1" />
        </svg>
        Scan
      </button>
      {scanning && (
        <BarcodeScanner
          onResult={(wine) => {
            setScanning(false);
            if (wine) setSelectedWine(wine);
          }}
          onClose={() => setScanning(false)}
        />
      )}
    </div>
  );
};

const WineDisplay = ({ wine }: { wine: WineItem }) => {
  const { storage, setSelectedWine } = usePositionContext();

  const locations = storage[wine.iWine] || [];

  return (
    <div className="flex w-full justify-between px-4 py-3 gap-4 items-start border-t-2 border-ct-primary bg-ct-primary-light">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-sm text-ct-primary">
            {wine.Vintage} {wine.Wine}
          </h2>
          <button
            onClick={() => setSelectedWine(undefined)}
            className="shrink-0 text-ct-muted hover:text-ct-primary transition-colors leading-none"
            aria-label="Deselect wine"
          >
            ×
          </button>
        </div>
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
