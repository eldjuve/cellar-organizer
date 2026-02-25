import { useState } from "react";
import { Link, useFetcher } from "react-router";

export const SetupSelector = ({ setupList }: { setupList: string[] }) => {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState(setupList[0] ?? "");
  const fetcher = useFetcher();

  const handleCreate = () => {
    fetcher.submit({ name }, { method: "post", action: "/setup" });
    setEditing(false);
    setName("");
  };

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
      {editing ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Setup name"
            className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-slate-100"
          />
          <button onClick={handleCreate} className="button-primary">Save</button>
          <button onClick={() => setEditing(false)} className="button-secondary">Cancel</button>
        </div>
      ) : (
        <button onClick={() => setEditing(true)} className="button-primary">New Setup</button>
      )}
    </div>
  );
};
