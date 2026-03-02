import { env } from "workers/store";
import { getSession } from "~/sessions.server";
import { redirect } from "react-router";
import type { Route } from "./+types/api.barcode";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  if (!session.has("username")) return redirect("/login");

  const code = new URL(request.url).searchParams.get("code") ?? "";
  const wine = code
    ? env.WINE_STORE.getByName(session.get("username")!).lookupBarcode(code)
    : null;
  return Response.json({ wine });
}
