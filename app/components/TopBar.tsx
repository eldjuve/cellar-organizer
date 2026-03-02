import { Form, Link } from "react-router";
import { Logo } from "./Logo";

export function TopBar({ username }: { username: string }) {
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
        </div>
      </div>
    </header>
  );
}
