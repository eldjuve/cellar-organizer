import type { Route } from "./+types/home";
import { env } from "workers/store";
import { getSession } from "~/sessions.server";
import { redirect } from "react-router";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));

  if (!session.has("username") || !session.has("password")) {
    return redirect("/login");
  }

  const username = session.get("username")!;
  const setupStore = env.SETUP_STORE.getByName(username);
  const setupList = await setupStore.getSetupList();

  return setupList.length > 0
    ? redirect(`/${setupList[0].id}`)
    : redirect("/setup/new");
}

export default function Home() {
  return null;
}
