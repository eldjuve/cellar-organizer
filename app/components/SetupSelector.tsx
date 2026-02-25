import { useState } from "react";
import { Link } from "react-router";

export const SetupSelector = ({ setupList }: { setupList: string[] }) => {
  const [selected, setSelected] = useState(setupList[0] ?? "");

  return (
    <div className="flex items-center gap-2">
      {setupList.length > 0 && (
        <>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-slate-100"
          >
            {setupList.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
          <Link to={`/setup/${selected}`} className="button-primary">Edit</Link>
        </>
      )}
      <Link to="/setup/new" className="button-primary">New Setup</Link>
    </div>
  );
};
