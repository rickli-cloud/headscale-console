import type { Component } from "svelte";

export type AppRoutes = { path: string | RegExp; component: Component }[];

export function getPathParams(path: string): string {
  if (/^#/.test(path)) path = path.replace(/^#/, "");

  const splitRoute = path.split(/\?/g);

  if (splitRoute.length === 1) return "";

  return splitRoute[splitRoute.length - 1];
}

export function getPathClean(path: string): string {
  if (/^#/.test(path)) path = path.replace(/^#/, "");

  const splitRoute = path.split(/\?/g);

  if (splitRoute.length === 1) return path;

  // Must have another "?" in the URL
  return splitRoute.filter((_, i, arr) => i !== arr.length - 1).join("?");
}

export function getRouteComponent(routes: AppRoutes, path: string): Component {
  path = getPathClean(path);

  console.debug("getRouteComponent", path, routes);

  for (const route of routes) {
    if (
      (typeof route.path === "string" && route.path == path) ||
      (route.path instanceof RegExp && route.path.test(path))
    ) {
      return route.component;
    }
  }

  // Fallback
  const route = routes.find(({ path }) => path === "*");
  if (route) return route.component;

  throw new Error("Failed to find a route");
}
