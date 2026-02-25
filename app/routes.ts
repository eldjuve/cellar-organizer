import { type RouteConfig, index, prefix, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route(":setupId", "routes/home.tsx"),
  route("login", "routes/login.tsx"),
  ...prefix("setup", [
    route(":id", "routes/setup/setup.tsx"),
  ]),
] satisfies RouteConfig;
