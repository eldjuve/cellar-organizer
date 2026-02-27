import { Fridge } from "./Fridge";
import { Display } from "./Selected";
import type { ShelfProps } from "types";

export function StorageView({ config }: { config?: ShelfProps[] }) {
  return (
    <div className="h-full grid grid-rows-[1fr_min-content]">
      <Fridge config={config} />
      <Display />
    </div>
  );
}
