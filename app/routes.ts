import { type RouteConfig, index, prefix, route } from "@react-router/dev/routes";

export default [
  index("routes/layout.tsx", { id: "root-index" }),
  route(":setupId", "routes/layout.tsx", [
    index("routes/storage-view.tsx"),
  ]),
  route("login", "routes/login.tsx"),
  route("logout", "routes/logout.tsx"),
  ...prefix("setup", [
    route(":id", "routes/setup/setup.tsx"),
  ]),
  route("api/barcode", "routes/api.barcode.ts"),
  route("api/wine", "routes/api.wine.ts"),
] satisfies RouteConfig;
