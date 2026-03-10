import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";

type FilterOptions = { types: string[]; countries: string[] };
type ActiveFilters = { q: string; type: string; country: string; placement: "all" | "active" | "pending" };

export function FilterBar({ filterOptions, activeFilters, listCount }: {
  filterOptions: FilterOptions;
  activeFilters: ActiveFilters;
  listCount: number;
}) {
  const [, setSearchParams] = useSearchParams();
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

  const handlePlacement = (value: "all" | "active" | "pending") => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value === "all") next.delete("placement"); else next.set("placement", value);
      return next;
    }, { replace: true });
  };

  const hasFilters = activeFilters.q || activeFilters.type || activeFilters.country || activeFilters.placement !== "all";

  const clearAll = () => {
    setLocalQ("");
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("q");
      next.delete("type");
      next.delete("country");
      next.delete("placement");
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
      <div className="flex border border-ct-border rounded overflow-hidden text-sm">
        {(["all", "active", "pending"] as const).map((v) => (
          <button
            key={v}
            onClick={() => handlePlacement(v)}
            className={`px-2 py-1 transition-colors ${
              activeFilters.placement === v
                ? "bg-ct-primary text-white"
                : "text-ct-muted hover:text-ct-primary"
            }`}
          >
            {v === "all" ? "All" : v === "active" ? "Active" : "Pending"}
          </button>
        ))}
      </div>
      {hasFilters && (
        <button
          onClick={clearAll}
          className="px-2 py-1 rounded border border-ct-border text-ct-muted hover:text-ct-text text-sm transition-colors"
        >
          Clear
        </button>
      )}
      <span className="ml-auto text-ct-muted tabular-nums">{listCount} wines</span>
    </div>
  );
}
