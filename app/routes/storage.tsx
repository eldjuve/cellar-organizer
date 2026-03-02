import type { Route } from "./+types/storage";
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
import { SetupSelector } from "~/components/SetupSelector";
import { TopBar } from "~/components/TopBar";
import type { SetupListItem, StorageSetup, WineItem } from "types";

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

  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";
  const type = url.searchParams.get("type") ?? "";
  const country = url.searchParams.get("country") ?? "";
  const placement = (url.searchParams.get("placement") ?? "all") as "all" | "active" | "pending";

  const wineStore = env.WINE_STORE.getByName(username);

  // Backfill for existing users who logged in before this feature
  if ((await wineStore.getCount()) === 0) {
    const all = await fetchWineData(username, session.get("password")!);
    await wineStore.setInventory(all);
  }

  const setupStore = env.SETUP_STORE.getByName(username);

  const [filterOptions, listWines, locations, placedInventory, setupList, setup] = await Promise.all([
    wineStore.getFilterOptions(),
    wineStore.queryInventory(q || undefined, type || undefined, country || undefined),
    wineStore.getInventory(),
    wineStore.getWinesInSetup(params.setupId!),
    setupStore.getSetupList(),
    setupStore.getSetup(params.setupId!),
  ]);

  const placedInSetup = new Set(
    Object.entries(locations)
      .filter(([, ps]) => ps.some((p) => p.setupId === params.setupId))
      .map(([iWine]) => iWine)
  );

  let listInventory: WineItem[] = listWines;
  if (placement === "active") listInventory = listInventory.filter((w) => placedInSetup.has(w.iWine));
  if (placement === "pending") listInventory = listInventory.filter((w) => (locations[w.iWine]?.length ?? 0) < Number(w.Quantity));

  return {
    listInventory,
    placedInventory,
    locations,
    filterOptions,
    activeFilters: { q, type, country, placement },
    setupList,
    activeSetupId: params.setupId,
    setupConfig: setup?.config ?? null,
    username,
  };
}


export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  if (!session.has("username") || !session.has("password")) {
    return redirect("/login");
  }
  const username = session.get("username")!;
  const password = session.get("password")!;
  const inventory = await fetchWineData(username, password);
  const wineStore = env.WINE_STORE.getByName(username);
  await wineStore.setInventory(inventory);
  return { ok: true };
}

export default function Storage({ loaderData }: Route.ComponentProps) {
  const fetcher = useFetcher();
  const isRefetching = fetcher.state !== "idle";
  return (
    <main className="flex flex-col h-dvh overflow-hidden bg-ct-bg pb-[env(safe-area-inset-bottom)]">
      <TopBar
        username={loaderData.username}
        onRefetch={() => fetcher.submit({}, { method: "POST" })}
        isRefetching={isRefetching}
      />
      <div className="p-3 flex flex-col gap-3 flex-1 overflow-hidden">
        <PositionContextProvider
          listInventory={loaderData.listInventory}
          placedInventory={loaderData.placedInventory}
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
