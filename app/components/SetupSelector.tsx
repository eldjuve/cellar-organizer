import { Link, useNavigate } from "react-router";
import type { SetupListItem } from "types";

export const SetupSelector = ({
  setupList,
  activeSetupId,
}: {
  setupList: SetupListItem[];
  activeSetupId: string;
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-2">
      {setupList.length > 0 && (
        <>
          <select
            value={activeSetupId}
            onChange={(e) => navigate(`/${e.target.value}`)}
            className="rounded border border-slate-700 bg-slate-800 px-2 py-2 text-slate-100"
          >
            {setupList.map(({ id, name }) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
          <Link to={`/setup/${activeSetupId}`} className="button-primary">Edit</Link>
        </>
      )}
      <Link to="/setup/new" className="button-primary">New Setup</Link>
    </div>
  );
};
