import { PositionContextProvider } from "~/components/PositionContextProvider";
import { Shelf } from "~/components/Storage/Fridge";
import { getSession } from "~/sessions.server";
import type { Route } from "./+types/setup";
import { redirect } from "react-router";
import { useState } from "react";
import { env } from "workers/store";
import type { ShelfProps, StorageSetup } from "types";

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const name = params.name;

  const username = session.get("username");
  const password = session.get("password");

  if (!username || !password) {
    // Redirect to the login page if they are not signed in.
    return redirect("/login");
  }

  if (!name) {
    return redirect("/setup");
  }

  const userStore = env.SETUP_STORE.getByName(`${username}`);
  const config = await userStore.getSetup(name);

  return { config };
}

export default function Component({ loaderData, params }: Route.ComponentProps) {
  if (!loaderData || !loaderData.config) {
    return (
      <div className="min-h-screen flex flex-col items-center gap-4 bg-gradient-to-b from-slate-950 to-slate-900 p-4 text-slate-100">
        <p>No data for {params.name}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center gap-4 bg-gradient-to-b from-slate-950 to-slate-900 p-4 text-slate-100">
      <div className="w-full max-w-5xl rounded-xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-black/40 backdrop-blur">
        <div className="mb-4 flex items-center gap-2">
          <h1 className="text-lg font-semibold text-slate-100">
            Configure {params.name} 🍷
          </h1>
        </div>

        <PositionContextProvider storedPlacements={{}} inventory={[]}>
          <SetupFridge storedConfig={loaderData.config} />
        </PositionContextProvider>
      </div>
    </div>
  );
}

export function SetupFridge({ storedConfig }: { storedConfig: StorageSetup }) {
  const [config, setConfig] = useState(storedConfig);

  const addShelf = () => {
    setConfig((cur) => {
      const last = cur.at(-1) ?? { layers: 1, capacity: 8, innerRow: false };
      return [...cur, { ...last }];
    });
  };

  const updateShelf = (shelf: number, update: ShelfProps) => {
    const maxLayersValue = maxLayers(update);

    setConfig((cur) =>
      cur.map((config, index) => {
        if (index === shelf) {
          // Maybe an idea, not sure
          // if (config.layers && config.layers > maxLayersValue) {
          //   return{ ...update, layers: maxLayersValue };
          // }
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
      <div className="flex gap-4 overflow-hidden">
        <div className="grow-1 overflow-hidden">
          <div className="flex flex-col">
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
        </div>
        <label>
          Layers:
          <br />
          <input
            type="number"
            min={1}
            max={maxLayers(options)}
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

const maxLayers = (options: ShelfProps) => {
  return options.innerRow ? Math.ceil(options.capacity / 2) : options.capacity
}
