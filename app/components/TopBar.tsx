import { Form, Link } from "react-router";
import { Logo } from "./Logo";

export function TopBar({
  username,
  onRefetch,
  isRefetching,
}: {
  username: string;
  onRefetch?: () => void;
  isRefetching?: boolean;
}) {
  return (
    <header className="flex items-center justify-between px-4 py-2 border-b border-ct-border bg-ct-surface text-sm pt-[max(0.5rem,env(safe-area-inset-top))]">
      <Link to="/"><Logo /></Link>
      <div className="flex items-center gap-4">
        <Form method="POST" action="/logout">
          <button
            type="submit"
            className="font-medium text-ct-primary hover:text-ct-primary-hover transition-colors"
          >
            Logout
          </button>
        </Form>
        <div className="flex items-center gap-1.5 text-ct-muted">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
          <span>{username}</span>
          {onRefetch && (
            <button
              onClick={onRefetch}
              disabled={isRefetching}
              title="Refresh collection from CellarTracker"
              className="text-ct-muted hover:text-ct-text transition-colors disabled:opacity-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={isRefetching ? "animate-spin" : ""}
              >
                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
