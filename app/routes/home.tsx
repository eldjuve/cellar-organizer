import type { Route } from "./+types/home";
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
import type { SetupListItem } from "types";

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
  const setupList = setupStore.getSetupList();

  const setupId = (params as { setupId?: string }).setupId;

  if (!setupId) {
    return setupList.length > 0
      ? redirect(`/${setupList[0].id}`)
      : redirect("/setup/new");
  }

  const inventory = await fetchWineData(username, session.get("password")!);

  const userStore = env.BOTTLE_STORE.getByName(username);
  const locations = await userStore.getInventory();

  return { inventory, locations, setupList, activeSetupId: setupId };
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
  if (!loaderData) return null;

  return (
    <main className="p-2 flex flex-col gap-4 h-dvh overflow-hidden">
      <PositionContextProvider
        inventory={loaderData.inventory}
        storedPlacements={loaderData.locations}
        activeSetupId={loaderData.activeSetupId}
      >
        <Columns
          setupList={loaderData.setupList}
          activeSetupId={loaderData.activeSetupId}
        />
        <MobileMenu />
      </PositionContextProvider>
    </main>
  );
}

const Columns = ({
  setupList,
  activeSetupId,
}: {
  setupList: SetupListItem[];
  activeSetupId: string;
}) => {
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
        <SetupSelector setupList={setupList} activeSetupId={activeSetupId} />
        <StorageView />
      </aside>
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
