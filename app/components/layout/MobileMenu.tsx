import { useAppContext } from "../AppContextProvider";

export const MobileMenu = () => {
  const { activeTab, toggleTab } = useAppContext();

  return (
    <nav className="mobile-menu flex w-full justify-center md:hidden">
      <button
        className="flex border border-ct-border rounded overflow-hidden text-sm font-medium"
        onClick={toggleTab}
      >
        <div className={`px-4 py-2 transition-colors ${activeTab === "list" ? "bg-ct-primary text-white" : "bg-ct-surface text-ct-text"}`}>
          Wine list
        </div>
        <div className={`px-4 py-2 transition-colors ${activeTab === "storage" ? "bg-ct-primary text-white" : "bg-ct-surface text-ct-text"}`}>
          Storage
        </div>
      </button>
    </nav>
  );
};
