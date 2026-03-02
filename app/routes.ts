import { type RouteConfig, index, prefix, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route(":setupId", "routes/storage.tsx"),
  route("login", "routes/login.tsx"),
  route("logout", "routes/logout.tsx"),
  ...prefix("setup", [
    route(":id", "routes/setup/setup.tsx"),
  ]),
] satisfies RouteConfig;
