import { env } from "workers/store";
import { redirect, useFetcher } from "react-router";
import { getSession } from "~/sessions.server";
import type { Route } from "./+types/index";
import { useState } from "react";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));

  const username = session.get("username");
  const password = session.get("password");

  if (!username || !password) {
    // Redirect to the login page if they are not signed in.
    return redirect("/login");
  }

  const userStore = env.SETUP_STORE.getByName(`${username}`);
  const setupList = await userStore.getSetupList();

  return { setupList };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const name = formData.get("name") as string;

  const session = await getSession(request.headers.get("Cookie"));

  const username = session.get("username");
  const password = session.get("password");

  if (!username || !password) {
    // Redirect to the login page if they are not signed in.
    return redirect("/login");
  }

  if (!name) {
    return null;
  }

  const userStore = env.SETUP_STORE.getByName(`${username}`);
  await userStore.setSetup(name, []);

  return redirect(`/setup/${name}`);
}

export default function Component({ loaderData }: Route.ComponentProps) {

  return (
    <div className="min-h-screen flex flex-col items-center gap-4 bg-gradient-to-b from-slate-950 to-slate-900 p-4 text-slate-100">
      <div className="w-full max-w-5xl rounded-xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-black/40 backdrop-blur">
        <div className="mb-4 flex items-center gap-2">
            {
              loaderData.setupList.length ? (
              <select>
                {loaderData.setupList?.map(name => (
                  <option>{name}</option>
                ))}
              </select>
              ) : null
            }
            <NewSetup />
        </div>
      </div>
    </div>
  );
}

const NewSetup = () => {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");

  const fetcher = useFetcher();

  const handleCreate = () => {
    fetcher.submit({ name }, { method: "post" });
  };
  
  return (
    <div>
      {editing ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Setup Name"
            className="input-primary"
          />
          <button onClick={handleCreate} className="button-primary">
            Save
          </button>
          <button onClick={() => setEditing(false)} className="button-secondary">
            Cancel
          </button>
        </div>
      ) : (
        <button onClick={() => setEditing(true)} className="button-primary">
          New Setup
        </button>
      )}
    </div>
  );
}