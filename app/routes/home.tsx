import type { Route } from "./+types/home";
import { env } from "workers/store";

import {
  PositionContextProvider,
  usePositionContext,
} from "../components/PositionContextProvider";
import { List } from "~/components/List";
import { fetchWineData } from "~/utils.server";
import { getSession } from "~/sessions.server";
import { redirect, useFetcher } from "react-router";
import { StorageView } from "~/components/Storage/Storage";
import { useState } from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Cellar Tracker cellar organizer" },
    { name: "description", content: "Organize your wine!" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));

  if (!session.has("username") || !session.has("password")) {
    // Redirect to the login page if they are not signed in.
    return redirect("/login");
  }

  const inventory = await fetchWineData(
    session.get("username")!,
    session.get("password")!,
  );

  const userStore = env.BOTTLE_STORE.getByName(session.get("username")!);
  const locations = await userStore.getInventory();

  const setupStore = env.SETUP_STORE.getByName(session.get("username")!);
  const setupList = await setupStore.getSetupList();

  return { inventory, locations, setupList };
}

export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(request.headers.get("Cookie"));

  const userStore = env.BOTTLE_STORE.getByName(session.get("username")!);

  const formData = await request.formData();
  const wineId = formData.get("iWine") as string;
  const locations = formData.get("locations") as string;
  await userStore.placeBottle(wineId, locations);
  return null;
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <main className="p-2 flex flex-col gap-4 h-dvh overflow-hidden">
      <PositionContextProvider
        inventory={loaderData.inventory}
        storedPlacements={loaderData.locations}
      >
        <Columns setupList={loaderData.setupList} />
        <MobileMenu />
      </PositionContextProvider>
    </main>
  );
}

const Columns = ({ setupList }: { setupList: string[] }) => {
  const { activeTab } = usePositionContext();
  return (
    <div className="flex h-full gap-4 overflow-hidden">
      <aside
        className={`flex-1 overflow-y-auto ${activeTab === "storage" ? "max-md:hidden" : ""}`}
      >
        <List />
      </aside>
      <aside
        className={`flex-1 overflow-hidden flex flex-col gap-2 ${activeTab === "list" ? "max-md:hidden" : ""}`}
      >
        <SetupSelector setupList={setupList} />
        <StorageView />
      </aside>
    </div>
  );
};

const SetupSelector = ({ setupList }: { setupList: string[] }) => {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const fetcher = useFetcher();

  const handleCreate = () => {
    fetcher.submit({ name }, { method: "post", action: "/setup" });
    setEditing(false);
    setName("");
  };

  return (
    <div className="flex items-center gap-2">
      {setupList.length > 0 && (
        <select className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-slate-100">
          {setupList.map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>
      )}
      {editing ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Setup name"
            className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-slate-100"
          />
          <button onClick={handleCreate} className="button-primary">Save</button>
          <button onClick={() => setEditing(false)} className="button-secondary">Cancel</button>
        </div>
      ) : (
        <button onClick={() => setEditing(true)} className="button-primary">New Setup</button>
      )}
    </div>
  );
};

const MobileMenu = () => {
  const { activeTab, toggleTab } = usePositionContext();

  return (
    <nav className="mobile-menu flex w-full justify-center md:hidden">
      <button className="flex border rounded" onClick={toggleTab}>
        <div className={`p-2 ${activeTab === "list" && "bg-blue-800"}`}>
          Winelist
        </div>
        <div className={`p-2 ${activeTab === "storage" && "bg-blue-800"}`}>
          Storage
        </div>
      </button>
    </nav>
  );
};
