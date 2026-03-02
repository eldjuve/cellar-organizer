import type { Route } from "./+types/storage";
import { env } from "workers/store";

import {
  PositionContextProvider,
  usePositionContext,
} from "../components/PositionContextProvider";
import { List } from "~/components/List";
import { fetchWineData } from "~/utils.server";
import { getSession } from "~/sessions.server";
import { redirect } from "react-router";
import { StorageView } from "~/components/Storage/Storage";
import { SetupSelector } from "~/components/SetupSelector";
import { TopBar } from "~/components/TopBar";
import type { SetupListItem, StorageSetup } from "types";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Cellar Tracker cellar organizer" },
    { name: "description", content: "Organize your wine!" },
  ];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));

  if (!session.has("username") || !session.has("password")) {
    return redirect("/login");
  }

  const username = session.get("username")!;

  const setupStore = env.SETUP_STORE.getByName(username);
  const [setupList, setup] = await Promise.all([
    setupStore.getSetupList(),
    setupStore.getSetup(params.setupId!),
  ]);

  const inventory = await fetchWineData(username, session.get("password")!);

  const userStore = env.BOTTLE_STORE.getByName(username);
  const locations = await userStore.getInventory();

  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";
  const type = url.searchParams.get("type") ?? "";
  const country = url.searchParams.get("country") ?? "";
  const inSetup = url.searchParams.get("inSetup") === "1";

  const filterOptions = {
    types: [...new Set(inventory.map((w) => w.Type).filter(Boolean))].sort(),
    countries: [...new Set(inventory.map((w) => w.Country).filter(Boolean))].sort(),
  };

  const placedInSetup = new Set(
    Object.entries(locations)
      .filter(([, placements]) => placements.some((p) => p.setupId === params.setupId))
      .map(([iWine]) => iWine)
  );

  let listInventory = inventory;
  if (inSetup) listInventory = listInventory.filter((w) => placedInSetup.has(w.iWine));
  if (type) listInventory = listInventory.filter((w) => w.Type === type);
  if (country) listInventory = listInventory.filter((w) => w.Country === country);
  if (q) listInventory = listInventory.filter((w) =>
    `${w.Wine} ${w.Producer}`.toLowerCase().includes(q.toLowerCase())
  );

  const listWineIds = new Set(listInventory.map((w) => w.iWine));

  const placedWines = inventory.filter((w) => placedInSetup.has(w.iWine) && !listWineIds.has(w.iWine));
  const mergedInventory = [...listInventory, ...placedWines];

  return {
    inventory: mergedInventory,
    listWineIds: [...listWineIds],
    locations,
    filterOptions,
    activeFilters: { q, type, country, inSetup },
    setupList,
    activeSetupId: params.setupId,
    setupConfig: setup?.config ?? null,
    username,
  };
}


export default function Storage({ loaderData }: Route.ComponentProps) {
  return (
    <main className="flex flex-col h-dvh overflow-hidden bg-ct-bg">
      <TopBar username={loaderData.username} />
      <div className="p-3 flex flex-col gap-3 flex-1 overflow-hidden">
        <PositionContextProvider
          inventory={loaderData.inventory}
          listWineIds={loaderData.listWineIds}
          storedPlacements={loaderData.locations}
          activeSetupId={loaderData.activeSetupId}
          filterOptions={loaderData.filterOptions}
          activeFilters={loaderData.activeFilters}
        >
          <Columns
            setupList={loaderData.setupList}
            activeSetupId={loaderData.activeSetupId}
            setupConfig={loaderData.setupConfig}
          />
          <MobileMenu />
        </PositionContextProvider>
      </div>
    </main>
  );
}

const Columns = ({
  setupList,
  activeSetupId,
  setupConfig,
}: {
  setupList: SetupListItem[];
  activeSetupId: string;
  setupConfig: StorageSetup | null;
}) => {
  const { activeTab } = usePositionContext();
  return (
    <div className="flex h-full gap-3 overflow-hidden">
      <aside
        className={`flex-1 overflow-y-auto rounded border border-ct-border bg-ct-surface ${activeTab === "storage" ? "max-md:hidden" : ""}`}
      >
        <List />
      </aside>
      <aside
        className={`flex-1 overflow-hidden flex flex-col gap-2 ${activeTab === "list" ? "max-md:hidden" : ""}`}
      >
        <SetupSelector setupList={setupList} activeSetupId={activeSetupId} />
        <StorageView config={setupConfig ?? undefined} />
      </aside>
    </div>
  );
};

const MobileMenu = () => {
  const { activeTab, toggleTab } = usePositionContext();

  return (
    <nav className="mobile-menu flex w-full justify-center md:hidden">
      <button
        className="flex border border-ct-border rounded overflow-hidden text-sm font-medium"
        onClick={toggleTab}
      >
        <div className={`px-4 py-2 transition-colors ${activeTab === "list" ? "bg-ct-primary text-white" : "bg-ct-surface text-ct-text"}`}>
          Wine list
        </div>
        <div className={`px-4 py-2 transition-colors ${activeTab === "storage" ? "bg-ct-primary text-white" : "bg-ct-surface text-ct-text"}`}>
          Storage
        </div>
      </button>
    </nav>
  );
};
