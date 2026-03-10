import { Link, useNavigate, useSearchParams } from "react-router";
import type { StorageConfigItem } from "types";
import { useAppContext } from "../AppContextProvider";

export const ConfigSelector = ({
  configList,
  activeConfigId,
}: {
  configList: StorageConfigItem[];
  activeConfigId: string;
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setSelectedWineId } = useAppContext();

  return (
    <div className="flex items-center gap-2">
      {configList.length > 0 && (
        <>
          <select
            value={activeConfigId}
            onChange={(e) => {
              setSelectedWineId(undefined);
              const qs = searchParams.toString();
              navigate(`/${e.target.value}${qs ? `?${qs}` : ""}`);
            }}
            className="rounded border border-ct-border bg-ct-surface text-ct-text px-2 py-1.5 text-sm flex-1 min-w-0"
          >
            {configList.map(({ id, name }) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
          <Link to={`/config/${activeConfigId}`} className="button-primary shrink-0">Edit</Link>
        </>
      )}
      <Link to="/config/new" className="button-primary shrink-0">New Setup</Link>
    </div>
  );
};
