import { PositionContextProvider } from "~/components/PositionContextProvider";
import { Shelf } from "~/components/Storage/Fridge";
import { getSession } from "~/sessions.server";
import type { Route } from "./+types/setup";
import { Form, redirect } from "react-router";
import { TopBar } from "~/components/TopBar";
import { useState, type CSSProperties } from "react";
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
    return { id: null, name: "", config: [] as StorageSetup, username };
  }

  const userStore = env.SETUP_STORE.getByName(username);
  const setup = await userStore.getSetup(params.id!);

  if (!setup) {
    return redirect("/");
  }

  return { id: params.id!, name: setup.name, config: setup.config, username };
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
  const savedId = await userStore.setSetup(id || null, name, config);

  return redirect(`/${savedId}`);
}

export default function Component({ loaderData }: Route.ComponentProps) {
  return (
    <div className="min-h-screen flex flex-col bg-ct-bg">
      <TopBar username={loaderData.username} />
      <div className="flex flex-col items-center gap-4 p-6">
        <div className="w-full max-w-5xl rounded-xl border border-ct-border bg-ct-surface p-6 shadow-sm">
          <PositionContextProvider storedPlacements={{}} inventory={[]}>
            <SetupFridge storedConfig={loaderData.config} initialName={loaderData.name} initialId={loaderData.id} />
          </PositionContextProvider>
        </div>
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
      <div className="flex items-center gap-3 pb-3 border-b border-ct-border">
        <label className="text-xs font-semibold uppercase tracking-wider text-ct-muted shrink-0">
          Setup name
        </label>
        <input
          type="text"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My cellar"
          className="flex-1 text-lg font-semibold bg-ct-bg text-ct-text placeholder:text-ct-muted px-3 py-1.5 rounded border border-ct-border focus:outline-none focus:border-ct-primary transition"
        />
        <button type="submit" className="button-primary shrink-0">Save</button>
      </div>
      <ul className="flex flex-col justify-center overflow-x-auto divide-y divide-ct-border" style={{ '--max-capacity': maxCapacity } as CSSProperties}>
        {config.map((layers, index) => (
          <li key={index} className="py-3">
            <ShelfOptions id={index} options={layers} onChange={updateShelf} />
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="rounded border border-ct-border text-ct-primary bg-ct-primary-light px-4 py-2 text-sm font-medium transition-colors"
        onClick={addShelf}
      >
        + New shelf
      </button>
    </Form>
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
            <Shelf options={options} shelfId={id} />
            <div className="flex gap-8 justify-center items-center mt-3">
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
                  className="w-22 rounded border border-ct-border bg-ct-bg text-ct-text px-2 py-1 text-sm focus:outline-none transition"
                />
              </label>
                <label className="text-sm flex items-center gap-1 text-ct-muted">
                  <input
                    type="checkbox"
                    className="mr-1 accent-[#8E2029]"
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
            className="w-22 rounded border border-ct-border bg-ct-bg text-ct-text px-2 py-1 text-sm focus:outline-none transition"
          />
        </label>
      </div>
    </>
  );
}

const maxLayers = (options: ShelfProps) => {
  return options.innerRow ? Math.ceil(options.capacity / 2) : options.capacity
}
