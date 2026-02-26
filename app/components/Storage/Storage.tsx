import { Fridge } from "./Fridge";
import { Display } from "./Selected";

export function StorageView() {
  return (
    <div className="h-full grid grid-rows-[1fr_min-content]">
      <Fridge />
      <Display />
    </div>
  );
}
