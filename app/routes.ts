import { type RouteConfig, index, prefix, route } from "@react-router/dev/routes";

export default [
  index("routes/layout.tsx", { id: "root-index" }),
  route(":configId", "routes/layout.tsx", [
    index("routes/storage-view.tsx"),
  ]),
  route("login", "routes/login.tsx"),
  route("logout", "routes/logout.tsx"),
  ...prefix("config", [
    route(":id", "routes/config/config.tsx"),
  ]),
  route("api/barcode", "routes/api.barcode.ts"),
  route("api/wine", "routes/api.wine.ts"),
] satisfies RouteConfig;
