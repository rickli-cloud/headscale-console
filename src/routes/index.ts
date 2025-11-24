import type { Component } from "svelte";
import { get } from "svelte/store";

import KeyRound from "lucide-svelte/icons/key-round";
import UsersIcon from "lucide-svelte/icons/users";
import Server from "lucide-svelte/icons/server";
import Cog from "lucide-svelte/icons/cog";

import { appConfig } from "$lib/store/config";

import Machines from "./Machines.svelte";
import Settings from "./Settings.svelte";
import Authkeys from "./Authkeys.svelte";
import Connect from "./Connect.svelte";
import Policy from "./Policy.svelte";
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
    path: /^\/?authkeys\/?(\?.*)?$/i,
    component: Authkeys,
    icon: KeyRound,
    href: "#/authkeys",
    name: "Authkeys",
    isHidden: () =>
      window.appRouter.currentPath !== "/authkeys" &&
      !get(appConfig).selfserviceHostname,
  },
  {
    path: /^\/?policy\/?(\?.*)?$/i,
    component: Policy,
    icon: Server,
    href: "#/policy",
    name: "Access Control",
    isHidden: () =>
      window.appRouter.currentPath !== "/policy" &&
      !get(appConfig).policyserviceHostname,
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
