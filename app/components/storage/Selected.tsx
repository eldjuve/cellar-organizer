import React from "react";
import type { BottlePlacement, WineItem } from "types";
import { useAppContext } from "../AppContextProvider";
import { useStorageContext } from "./Storage";
import { BarcodeScanner } from "../barcode/BarcodeScanner";
import { CellarTrackerLink } from "../CellarTrackerLink";
import { BarcodeScanIcon } from "../icons";

export function Display() {
  const { selectedWine } = useAppContext();

  if (!selectedWine) {
    return <WinePosition />;
  }

  return <WineDisplay wine={selectedWine} />;
}

const WinePosition = () => {
  const { selectedPosition, setSelectedWineId } = useAppContext();
  const [scanning, setScanning] = React.useState(false);

  if (!selectedPosition) return null;

  return (
    <div className="px-4 py-3 text-sm border-t border-ct-border text-ct-muted flex items-center justify-between gap-2">
      <span>Shelf {selectedPosition.shelf} · Layer {selectedPosition.layer} · Slot {selectedPosition.slot}</span>
      <button
        onClick={() => setScanning(true)}
        className="shrink-0 flex items-center gap-1 rounded border border-ct-border bg-ct-surface text-ct-muted text-xs px-2 py-1 hover:border-ct-primary hover:text-ct-primary transition-colors"
      >
        <BarcodeScanIcon className="w-3.5 h-3.5" />
        Scan
      </button>
      {scanning && (
        <BarcodeScanner
          onResult={(wine) => {
            setScanning(false);
            if (wine) setSelectedWineId(wine.iWine);
          }}
          onClose={() => setScanning(false)}
        />
      )}
    </div>
  );
};

const WineDisplay = ({ wine }: { wine: WineItem }) => {
  const { wineMatrix } = useStorageContext();
  const { setSelectedWineId } = useAppContext();

  const locations: BottlePlacement[] = [];
  
  for (const [shelf, layers] of Object.entries(wineMatrix)) {
    for (const [layer, slots] of Object.entries(layers)) {
      for (const [slot, w] of Object.entries(slots)) {
        if (w.iWine === wine.iWine) {
          locations.push({ setupId: "", shelf: Number(shelf), layer: Number(layer), slot: Number(slot) });
        }
      }
    }
  }

  return (
    <div className="flex w-full justify-between px-4 py-3 gap-4 items-start border-t-2 border-ct-primary bg-ct-primary-light">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-sm text-ct-primary">
            {wine.Vintage} {wine.Wine}
          </h2>
          <CellarTrackerLink iWine={wine.iWine} />
          <button
            onClick={() => setSelectedWineId(undefined)}
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
  const { removeWineFromSlot } = useStorageContext();

  return (
    <button
      className="flex items-center gap-1 rounded border border-ct-border bg-ct-surface text-ct-muted text-xs px-2 py-0.5 hover:border-ct-primary transition-colors"
      onClick={() => removeWineFromSlot(placement.shelf, placement.layer, placement.slot)}
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
