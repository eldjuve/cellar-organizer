import { PositionContextProvider } from "~/components/PositionContextProvider";
import { Shelf } from "~/components/Storage/Fridge";
import { getSession } from "~/sessions.server";
import type { Route } from "./+types/setup";
import { Form, redirect } from "react-router";
import { useState } from "react";
import { env } from "workers/store";
import type { ShelfProps, StorageSetup } from "types";

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const username = session.get("username");
  const password = session.get("password");

  if (!username || !password) {
    return redirect("/login");
  }

  if (params.id === "new") {
    return { id: null, name: "", config: [] as StorageSetup };
  }

  const userStore = env.SETUP_STORE.getByName(username);
  const setup = await userStore.getSetup(params.id!);

  if (!setup) {
    return redirect("/");
  }

  return { id: params.id!, name: setup.name, config: setup.config };
}

export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const username = session.get("username");
  const password = session.get("password");

  if (!username || !password) {
    return redirect("/login");
  }

  const formData = await request.formData();
  const id = formData.get("id") as string | null;
  const name = formData.get("name") as string;
  const config = JSON.parse(formData.get("config") as string) as StorageSetup;

  const userStore = env.SETUP_STORE.getByName(username);
  const savedId = userStore.setSetup(id || null, name, config);

  return redirect(`/setup/${savedId}`);
}

export default function Component({ loaderData }: Route.ComponentProps) {
  return (
    <div className="min-h-screen flex flex-col items-center gap-4 bg-gradient-to-b from-slate-950 to-slate-900 p-4 text-slate-100">
      <div className="w-full max-w-5xl rounded-xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-black/40 backdrop-blur">
        <PositionContextProvider storedPlacements={{}} inventory={[]}>
          <SetupFridge storedConfig={loaderData.config} initialName={loaderData.name} initialId={loaderData.id} />
        </PositionContextProvider>
      </div>
    </div>
  );
}

export function SetupFridge({ storedConfig, initialName, initialId }: { storedConfig: StorageSetup; initialName: string; initialId: string | null }) {
  const [config, setConfig] = useState(storedConfig);
  const [name, setName] = useState(initialName);

  const addShelf = () => {
    setConfig((cur) => {
      const last = cur.at(-1) ?? { layers: 1, capacity: 8, innerRow: false };
      return [...cur, { ...last }];
    });
  };

  const updateShelf = (shelf: number, update: ShelfProps) => {
    setConfig((cur) =>
      cur.map((config, index) => (index === shelf ? update : config)),
    );
  };

  const maxCapacity = Math.max(...config.map((shelf) => shelf.capacity));

  return (
    <Form method="post" className="flex flex-col gap-4">
      <input type="hidden" name="id" value={initialId ?? ""} />
      <input type="hidden" name="config" value={JSON.stringify(config)} />
      <div className="flex items-center gap-2">
        <input
          type="text"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Setup name"
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition"
        />
        <button type="submit" className="button-primary">Save</button>
      </div>
      <ul className="flex flex-col justify-center overflow-x-auto">
        {config.map((layers, index) => (
          <li key={index} className="p-2 border border-slate-700">
            <ShelfOptions id={index} options={layers} maxCapacity={maxCapacity} onChange={updateShelf} />
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="rounded-lg border border-slate-700 p-2"
        onClick={addShelf}
      >
        New shelf
      </button>
    </Form>
  );
}

function ShelfOptions({
  id,
  options,
  onChange,
  maxCapacity
}: {
  id: number;
  options: ShelfProps;
  maxCapacity: number;
  onChange: (shelf: number, options: ShelfProps) => void;
}) {
  return (
    <>
      <div className="flex gap-4 overflow-hidden">
        <div className="grow-1 overflow-hidden">
          <div className="flex flex-col">
            <Shelf maxCapacity={maxCapacity} options={options} shelfId={id} />
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
