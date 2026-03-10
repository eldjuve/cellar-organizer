import { data, redirect, useFetcher } from "react-router";
import type { Route } from "./+types/login";

import { getSession, commitSession } from "../sessions.server";
import { fetchWineData } from "~/utils.server";
import { env } from "workers/store";



export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));

  if (session.has("username")) {
    // Redirect to the home page if they are already signed in.
    return redirect("/");
  }

  return data(
    { error: session.get("error") },
    {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    },
  );
}

export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const form = await request.formData();
  const username = form.get("username");
  const password = form.get("password");

  if (typeof username !== "string" || typeof password !== "string") {
    session.flash("error", "Username and password are required");

    // Redirect back to the login page with errors.
    return redirect("/login", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  }

  try {
    const inventory = await fetchWineData(username, password);
    session.set("username", username);
    session.set("password", password);

    const wineStore = env.WINE_STORE.getByName(username);
    await wineStore.setInventory(inventory);

    // Login succeeded, send them to the home page.
    return redirect("/", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  } catch (e) {
    session.flash("error", "Invalid username/password");

    // Redirect back to the login page with errors.
    return redirect("/login", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  }
}

export default function Login({ loaderData }: Route.ComponentProps) {
  const { error } = loaderData;

  const fetcher = useFetcher();
  const loading = fetcher.state !== "idle";

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-ct-bg">
      <div className="flex flex-col w-full max-w-sm rounded-xl border border-ct-border bg-ct-surface p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="h-10">
            <img src="/ct_logo.png" alt="CellarTracker Logo" className="h-full w-auto" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-ct-text">
            Sign in to Cellar Organizer
          </h1>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 w-full text-center">
              {error}
            </p>
          )}
        </div>

        <form method="POST" className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-1 text-ct-text">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              className="w-full rounded border border-ct-border bg-ct-bg text-ct-text px-3 py-2.5 text-sm focus:outline-none transition"
              placeholder="Enter your username"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1 text-ct-text">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full rounded border border-ct-border bg-ct-bg text-ct-text px-3 py-2.5 text-sm focus:outline-none transition"
              placeholder="••••••••"
            />
          </div>

          <button
            disabled={loading}
            type="submit"
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded bg-ct-primary px-4 py-2.5 font-semibold text-white text-sm transition hover:bg-ct-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? <div className="loader" /> : "Sign in"}
          </button>
        </form>

        <button
          className="mt-4 text-sm text-ct-muted hover:text-ct-text transition-colors"
          onClick={() => fetcher.submit({ username: "demo", password: "demo" }, { method: "POST" })}
        >
          Use demo account
        </button>
      </div>
    </div>
  );
}
