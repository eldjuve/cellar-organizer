import type { Route } from "./+types/storage-view";
import { env } from "workers/store";

import { getSession } from "~/sessions.server";
import { redirect, useNavigate } from "react-router";
import { useEffect } from "react";
import { StorageView } from "~/components/Storage/Storage";
import { SetupSelector } from "~/components/SetupSelector";
import { useAppContext } from "~/components/AppContextProvider";

export async function action({ request, params }: Route.ActionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  if (!session.has("username")) return redirect("/login");
  const username = session.get("username")!;
  const formData = await request.formData();
  const intent = formData.get("intent") as "add" | "remove";
  const iWine = formData.get("iWine") as string;
  const shelf = Number(formData.get("shelf"));
  const layer = Number(formData.get("layer"));
  const slot = Number(formData.get("slot"));
  const wineStore = env.WINE_STORE.getByName(username);
  if (intent === "add") {
    return await wineStore.addPlacement(iWine, params.setupId!, shelf, layer, slot);
  }
  await wineStore.removePlacement(iWine, params.setupId!, shelf, layer, slot);
  return { ok: true };
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));

  if (!session.has("username") || !session.has("password")) {
    return redirect("/login");
  }

  const username = session.get("username")!;

  if (!params.setupId) {
    const setupStore = env.SETUP_STORE.getByName(username);
    const setupList = await setupStore.getSetupList();
    return setupList.length > 0
      ? redirect(`/${setupList[0].id}`)
      : redirect("/setup/new");
  }

  const wineStore = env.WINE_STORE.getByName(username);
  const setupStore = env.SETUP_STORE.getByName(username);

  const [winesInCurrentSetup, setupList, setup] = await Promise.all([
    wineStore.getWinesInSetup(params.setupId!),
    setupStore.getSetupList(),
    setupStore.getSetup(params.setupId!),
  ]);

  return {
    winesInCurrentSetup,
    setupList,
    activeSetupId: params.setupId!,
    setupConfig: setup?.config ?? null,
  };
}

export default function StorageView_({ loaderData }: Route.ComponentProps) {
  const { activeTab, selectedWine } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (!selectedWine?.placements?.length) return;
    const inCurrentSetup = selectedWine.placements.some(
      (p) => p.setupId === loaderData.activeSetupId
    );
    if (!inCurrentSetup) {
      navigate(`/${selectedWine.placements[0].setupId}`);
    }
  }, [selectedWine, loaderData.activeSetupId, navigate]);

  return (
    <aside className={`flex-1 overflow-hidden flex flex-col gap-2 ${activeTab === "list" ? "max-md:hidden" : ""}`}>
      <SetupSelector setupList={loaderData.setupList} activeSetupId={loaderData.activeSetupId} />
      <StorageView
        config={loaderData.setupConfig ?? undefined}
        inventory={loaderData.winesInCurrentSetup}
        setupId={loaderData.activeSetupId}
      />
    </aside>
  );
}
