import { ExternalLinkIcon } from "./icons";

export function CellarTrackerLink({ iWine }: { iWine: string }) {
  return (
    <a
      href={`https://www.cellartracker.com/wine.asp?iWine=${iWine}`}
      target="_blank"
      rel="noopener noreferrer"
      title="View on CellarTracker"
      onClick={(e) => e.stopPropagation()}
      className="text-ct-muted hover:text-ct-primary transition-colors"
    >
      <ExternalLinkIcon />
    </a>
  );
}
