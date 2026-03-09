import { env } from "workers/store";
import { getSession } from "~/sessions.server";
import { redirect } from "react-router";
import type { Route } from "./+types/api.wine";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  if (!session.has("username")) return redirect("/login");

  const iWine = new URL(request.url).searchParams.get("iWine") ?? "";
  const wine = iWine
    ? await env.WINE_STORE.getByName(session.get("username")!).getWineById(iWine)
    : null;
  return Response.json({ wine });
}
