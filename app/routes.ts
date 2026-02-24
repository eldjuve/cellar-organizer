import {
  type RouteConfig,
  index,
  prefix,
  route,
} from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  ...prefix("setup", [
    index("routes/setup/index.tsx"),
    route(":name", "routes/setup/setup.tsx"),
  ]),
] satisfies RouteConfig;
