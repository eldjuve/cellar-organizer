import { useState } from "react";
import { Link } from "react-router";
import type { SetupListItem } from "types";

export const SetupSelector = ({ setupList }: { setupList: SetupListItem[] }) => {
  const [selectedId, setSelectedId] = useState(setupList[0]?.id ?? "");

  return (
    <div className="flex items-center gap-2">
      {setupList.length > 0 && (
        <>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-slate-100"
          >
            {setupList.map(({ id, name }) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
          <Link to={`/setup/${selectedId}`} className="button-primary">Edit</Link>
        </>
      )}
      <Link to="/setup/new" className="button-primary">New Setup</Link>
    </div>
  );
};
