import { Form, Link } from "react-router";
import { Logo } from "./Logo";
import { UserIcon, RefreshIcon } from "./icons";

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
          <UserIcon />
          <span>{username}</span>
          {onRefetch && (
            <button
              onClick={onRefetch}
              disabled={isRefetching}
              title="Refresh collection from CellarTracker"
              className="text-ct-muted hover:text-ct-text transition-colors disabled:opacity-50"
            >
              <RefreshIcon className={isRefetching ? "animate-spin" : undefined} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
