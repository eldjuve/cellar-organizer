import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { usePositionContext } from "./PositionContextProvider";

export function FilterBar() {
  const { listInventory, filterOptions, activeFilters } = usePositionContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const [localQ, setLocalQ] = useState(activeFilters.q);

  // Sync localQ when activeFilters.q changes (e.g. back/forward nav)
  useEffect(() => {
    setLocalQ(activeFilters.q);
  }, [activeFilters.q]);

  // Debounce text search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (localQ) {
          next.set("q", localQ);
        } else {
          next.delete("q");
        }
        return next;
      }, { replace: true });
    }, 300);
    return () => clearTimeout(timer);
  }, [localQ, setSearchParams]);

  const handleType = (value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set("type", value); else next.delete("type");
      return next;
    }, { replace: true });
  };

  const handleCountry = (value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set("country", value); else next.delete("country");
      return next;
    }, { replace: true });
  };

  const handleInSetup = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (activeFilters.inSetup) next.delete("inSetup"); else next.set("inSetup", "1");
      return next;
    }, { replace: true });
  };

  const hasFilters = activeFilters.q || activeFilters.type || activeFilters.country || activeFilters.inSetup;

  const clearAll = () => {
    setLocalQ("");
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("q");
      next.delete("type");
      next.delete("country");
      next.delete("inSetup");
      return next;
    }, { replace: true });
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 border-b border-ct-border bg-ct-surface text-sm">
      <input
        type="text"
        value={localQ}
        onChange={(e) => setLocalQ(e.target.value)}
        placeholder="Search wine, producer..."
        className="flex-1 min-w-32 px-2 py-1 rounded border border-ct-border bg-white text-ct-text placeholder:text-ct-muted focus:outline-none focus:border-ct-primary text-sm"
      />
      <select
        value={activeFilters.type}
        onChange={(e) => handleType(e.target.value)}
        className="px-2 py-1 rounded border border-ct-border bg-white text-ct-text focus:outline-none focus:border-ct-primary text-sm"
      >
        <option value="">All types</option>
        {filterOptions.types.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
      <select
        value={activeFilters.country}
        onChange={(e) => handleCountry(e.target.value)}
        className="px-2 py-1 rounded border border-ct-border bg-white text-ct-text focus:outline-none focus:border-ct-primary text-sm"
      >
        <option value="">All countries</option>
        {filterOptions.countries.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <button
        onClick={handleInSetup}
        className={`px-2 py-1 rounded border text-sm transition-colors ${
          activeFilters.inSetup
            ? "bg-ct-primary text-white border-ct-primary"
            : "border-ct-border text-ct-muted hover:border-ct-primary hover:text-ct-primary"
        }`}
      >
        In setup
      </button>
      {hasFilters && (
        <button
          onClick={clearAll}
          className="px-2 py-1 rounded border border-ct-border text-ct-muted hover:text-ct-text text-sm transition-colors"
        >
          Clear
        </button>
      )}
      <span className="ml-auto text-ct-muted tabular-nums">{listInventory.length} wines</span>
    </div>
  );
}
