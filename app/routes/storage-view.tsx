import type { Route } from "./+types/storage-view";
import { env } from "workers/store";

import { getSession } from "~/sessions.server";
import { redirect, useNavigate } from "react-router";
import { useEffect } from "react";
import { StorageView } from "~/components/storage/StorageView";
import { ConfigSelector } from "~/components/storage/ConfigSelector";
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
  const clientId = formData.get("clientId") as string | null ?? undefined;
  const wineStore = env.WINE_STORE.getByName(username);
  if (intent === "add") {
    const result = await wineStore.addPlacement(iWine, params.configId!, shelf, layer, slot);
    if (result.ok) await wineStore.notifyPlacementAdded(iWine, params.configId!, shelf, layer, slot, clientId);
    return result;
  }
  await wineStore.removePlacement(iWine, params.configId!, shelf, layer, slot);
  await wineStore.notifyPlacementRemoved(iWine, params.configId!, shelf, layer, slot, clientId);
  return { ok: true };
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));

  if (!session.has("username") || !session.has("password")) {
    return redirect("/login");
  }

  const username = session.get("username")!;

  const wineStore = env.WINE_STORE.getByName(username);
  const configStore = env.CONFIG_STORE.getByName(username);

  const [wineMatrix, configList, storageConfig] = await Promise.all([
    wineStore.getWineMatrix(params.configId!),
    configStore.getConfigList(),
    configStore.getConfig(params.configId!),
  ]);

  return {
    wineMatrix,
    configList,
    activeConfigId: params.configId!,
    config: storageConfig?.config ?? null,
  };
}

export default function StorageView_({ loaderData }: Route.ComponentProps) {
  const { activeTab, selectedWine } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (!selectedWine?.placements.length) return;
    const inCurrentConfig = selectedWine.placements.some(
      (p) => p.configId === loaderData.activeConfigId
    );
    if (!inCurrentConfig) {
      navigate(`/${selectedWine.placements[0].configId}`);
    }
  }, [selectedWine, loaderData.activeConfigId, navigate]);

  return (
    <aside className={`flex-1 overflow-hidden flex flex-col gap-2 ${activeTab === "list" ? "max-md:hidden" : ""}`}>
      <ConfigSelector configList={loaderData.configList} activeConfigId={loaderData.activeConfigId} />
      <StorageView
        config={loaderData.config ?? undefined}
        wineMatrix={loaderData.wineMatrix}
        configId={loaderData.activeConfigId}
      />
    </aside>
  );
}
