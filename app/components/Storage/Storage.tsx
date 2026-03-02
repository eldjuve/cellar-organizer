import { Fridge } from "./Fridge";
import { Display } from "./Selected";
import type { ShelfProps } from "types";

export function StorageView({ config }: { config?: ShelfProps[] }) {
  return (
    <div className="grow grid rounded border border-ct-border bg-ct-surface overflow-hidden">
      <Fridge config={config} />
      <Display />
    </div>
  );
}
