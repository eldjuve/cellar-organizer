import { PositionContextProvider } from "~/components/PositionContextProvider";
import { Shelf, type ShelfProps } from "~/components/Storage/Fridge";
import { getSession } from "~/sessions.server";
import type { Route } from "../+types/root";
import { redirect } from "react-router";
import { useState } from "react";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));

  if (!session.has("username") || !session.has("password")) {
    // Redirect to the login page if they are not signed in.
    return redirect("/login");
  }

  return {};
}

export default function Setup() {
  const [name, setName] = useState("My Winefridge");

  return (
    <div className="min-h-screen flex flex-col items-center gap-4 bg-gradient-to-b from-slate-950 to-slate-900 p-4 text-slate-100">
      <div className="w-full max-w-5xl rounded-xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-black/40 backdrop-blur">
        <div className="mb-4 flex items-center gap-2">
          <h1 className="text-lg font-semibold text-slate-100">
            Configure your winefridge 🍷
          </h1>
        </div>

        <form className="flex flex-wrap items-end gap-4 text-sm">
          {/* Name */}
          <div className="flex flex-col flex-1 min-w-[160px]">
            <label htmlFor="name" className="mb-1 font-medium text-slate-300">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Wine Fridge"
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition"
            />
          </div>
        </form>
       <PositionContextProvider storedPlacements={{}} inventory={[]}>
          <SetupFridge name={name} />
        </PositionContextProvider>
      </div>
    </div>
  );
}

export function SetupFridge({ name }: { name: string }) {
  const [config, setConfig] = useState([
    { layers: 1, capacity: 8, innerRow: false },
  ] as ShelfProps[]);

  const addShelf = () => {
    setConfig((cur) => {
      const last = cur.at(-1) ?? { layers: 1, capacity: 8, innerRow: false };
      return [...cur, { ...last }];
    });
  };

  const updateShelf = (shelf: number, update: ShelfProps) => {
    setConfig((cur) =>
      cur.map((config, index) => {
        if (index === shelf) {
          return update;
        }
        return config;
      }),
    );
  };

  return (
    <div className="flex flex-col mt-4">
      <ul className="flex flex-col justify-center overflow-x-auto">
        {config.map((layers, index) => (
          <li key={index} className="p-2 border border-slate-700">
            <ShelfOptions id={index} options={layers} onChange={updateShelf} />
          </li>
        ))}
      </ul>
      <button
        className="rouded-lg border border-slate-700 p-2"
        onClick={addShelf}
      >
        New shelf
      </button>
    </div>
  );
}

function ShelfOptions({
  id,
  options,
  onChange,
}: {
  id: number;
  options: ShelfProps;
  onChange: (shelf: number, options: ShelfProps) => void;
}) {
  return (
    <>
      <div className="flex gap-4">
        <div className="grow-1">
          <Shelf options={options} id={id} />
          <div className="flex gap-8 justify-center items-center">
            <label>
              Bottles:{" "}
              <input
                type="number"
                min={1}
                value={options.capacity}
                onChange={(e) =>
                  onChange(id, { ...options, capacity: e.target.valueAsNumber })
                }
                placeholder="Bottles"
                className="w-22 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition"
              />
            </label>
            <label className="text-slate-300">
              <input
                type="checkbox"
                className="mr-1"
                checked={options.innerRow}
                onChange={(e) =>
                  onChange(id, { ...options, innerRow: e.target.checked })
                }
              />
              Feet-to-head
            </label>
          </div>
        </div>
        <label>
          Layers:
          <br/>
          <input
            type="number"
            min={1}
            max={options.capacity}
            value={options.layers}
            onChange={(e) =>
              onChange(id, { ...options, layers: e.target.valueAsNumber })
            }
            placeholder="Layers"
            className="w-22 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition"
          />
        </label>
      </div>
    </>
  );
}
