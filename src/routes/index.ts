import type { Component } from "svelte";

import UsersIcon from "lucide-svelte/icons/users";
import Server from "lucide-svelte/icons/server";
import Cog from "lucide-svelte/icons/cog";

import Machines from "./Machines.svelte";
import Settings from "./Settings.svelte";
import Connect from "./Connect.svelte";
import Users from "./Users.svelte";
import Auth from "./Auth.svelte";

export interface Route {
  path: RegExp;
  component: Component;
  icon?: typeof Server; // does not matter what icon is used
  href?: string;
  name?: string;
  isHidden?: () => boolean;
}

const routes: Route[] = [
  {
    path: /^\/?(\?.*)?$/,
    component: Machines,
    icon: Server,
    href: "#/",
    name: "Machines",
  },
  {
    path: /^\/?users\/?(\?.*)?$/i,
    component: Users,
    icon: UsersIcon,
    href: "#/users",
    name: "Users",
  },
  {
    path: /^\/?settings\/?(\?.*)?$/i,
    component: Settings,
    icon: Cog,
    href: "#/settings",
    name: "Settings",
  },
  {
    path: /^\/?connect\/?(\?.*)?$/i,
    component: Connect,
    isHidden: () => true,
  },
  {
    path: /^\/?_internal\/auth/i,
    component: Auth,
    isHidden: () => true,
  },
];

export default routes;
