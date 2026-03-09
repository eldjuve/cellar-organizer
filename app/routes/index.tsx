import type { Route } from "./+types/index";
import { env } from "workers/store";

import { AppContextProvider, useAppContext } from "../components/AppContextProvider";
import { List } from "~/components/List";
import { fetchWineData } from "~/utils.server";
import { getSession } from "~/sessions.server";
import { Outlet, redirect, useFetcher } from "react-router";
import { TopBar } from "~/components/TopBar";

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

  const [filterOptions, listInventory] = await Promise.all([
    wineStore.getFilterOptions(),
    wineStore.queryInventory(q || undefined, type || undefined, country || undefined, placement, params.setupId),
  ]);

  return {
    listInventory,
    filterOptions,
    activeFilters: { q, type, country, placement },
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
        <AppContextProvider>
          <StorageLayout loaderData={loaderData} />
        </AppContextProvider>
      </div>
    </main>
  );
}

const StorageLayout = ({ loaderData }: { loaderData: Route.ComponentProps["loaderData"] }) => {
  const { activeTab } = useAppContext();

  return (
    <>
      <div className="flex h-full gap-3 overflow-hidden">
        <aside className={`flex-1 overflow-y-auto rounded border border-ct-border bg-ct-surface ${activeTab === "storage" ? "max-md:hidden" : ""}`}>
          <List
            listInventory={loaderData.listInventory}
            filterOptions={loaderData.filterOptions}
            activeFilters={loaderData.activeFilters}
          />
        </aside>
        <Outlet />
      </div>
      <MobileMenu />
    </>
  );
};

const MobileMenu = () => {
  const { activeTab, toggleTab } = useAppContext();

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
