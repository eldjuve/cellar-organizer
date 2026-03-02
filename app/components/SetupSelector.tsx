import { Link, useNavigate } from "react-router";
import type { SetupListItem } from "types";
import { usePositionContext } from "./PositionContextProvider";

export const SetupSelector = ({
  setupList,
  activeSetupId,
}: {
  setupList: SetupListItem[];
  activeSetupId: string;
}) => {
  const navigate = useNavigate();
  const { setSelectedWine } = usePositionContext();

  return (
    <div className="flex items-center gap-2">
      {setupList.length > 0 && (
        <>
          <select
            value={activeSetupId}
            onChange={(e) => {
              setSelectedWine(undefined);
              navigate(`/${e.target.value}`);
            }}
            className="rounded border border-ct-border bg-ct-surface text-ct-text px-2 py-1.5 text-sm flex-1 min-w-0"
          >
            {setupList.map(({ id, name }) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
          <Link to={`/setup/${activeSetupId}`} className="button-primary shrink-0">Edit</Link>
        </>
      )}
      <Link to="/setup/new" className="button-primary shrink-0">New Setup</Link>
    </div>
  );
};
