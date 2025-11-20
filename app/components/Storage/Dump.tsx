import { usePositionContext } from "../PositionContextProvider";

export function Dump() {
  const { onLocationSelect } = usePositionContext();

  return (
    <div className="flex justify-center mt-2">
      <button
        className="w-full h-8 border-2 border-black rounded bg-white text-black"
        onClick={() => onLocationSelect("dump")}
      >
        Off-shelf
      </button>
    </div>
  );
}
