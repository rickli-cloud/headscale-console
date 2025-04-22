import { ModeWatcher } from "mode-watcher";
import { mount, unmount } from "svelte";

import { createClient, IpnEventHandler } from "$lib/api/tsconnect";
import { loadIpnProfiles, netMap } from "$lib/store/ipn";
import type { Ipn } from "$lib/types/ipn.d";
import {
  getPathParams,
  getRouteComponent,
  type AppRoutes,
} from "$lib/utils/router";

import "./app.css";

import LoadingScreen from "./LoadingScreen.svelte";
import LoginScreen from "./LoginScreen.svelte";
import Connect from "./Connect.svelte";
import NotFound from "./404.svelte";
import App from "./App.svelte";

declare global {
  interface Window {
    ipn: IPN;
    ipnProfile: Ipn.Profile | undefined;
    ipnEventHandler: IpnEventHandler;
  }
}

const routes: AppRoutes = [
  {
    path: /^\/?$/,
    component: App,
  },
  {
    path: /^\/?connect\/?$/,
    component: Connect,
  },
  {
    path: "*",
    component: NotFound,
  },
];

(async () => {
  const appEl = document.getElementById("app")!;

  mount(ModeWatcher, { target: document.body });

  let loadingScreen: Mount = mount(LoadingScreen, { target: appEl });

  let app: Mount;
  let loginScreen: Mount;
  let stopped = false;

  const authKey =
    new URLSearchParams(getPathParams(window.location.hash)).get("k") ||
    undefined;

  let tsProfiles = loadIpnProfiles();

  window.ipnProfile = tsProfiles.current
    ? tsProfiles.profiles[tsProfiles.current]
    : undefined;

  window.ipn = await createClient({
    panicHandler: console.error,
    routeAll: true,
    authKey,
    controlURL:
      import.meta.env.VITE_DEV_HEADSCALE_HOST ||
      window.ipnProfile?.ControlURL ||
      new URL("/", window.location.toString()).toString(),
  });

  window.ipnEventHandler = new IpnEventHandler();

  window.ipnEventHandler.addEventListener(
    window.ipnEventHandler.Events.browseToURL,
    (ev) => {
      if (!(ev instanceof window.ipnEventHandler.NotifyBrowseToURLEvent)) {
        throw new Error(
          `Event payload for "${window.ipnEventHandler.Events.browseToURL}" is not instance of NotifyBrowseToURLEvent`,
          { cause: ev }
        );
      }

      if (loadingScreen) {
        unmount(loadingScreen);
        loadingScreen = undefined;
      }

      loginScreen = mount(LoginScreen, {
        target: appEl,
        props: { url: ev.url },
      });
    }
  );

  window.ipnEventHandler.addEventListener(
    window.ipnEventHandler.Events.state,
    async (ev) => {
      if (!(ev instanceof window.ipnEventHandler.NotifyStateEvent)) {
        throw new Error(
          `Event payload for "${window.ipnEventHandler.Events.state}" is not instance of NotifyStateEvent`,
          { cause: ev }
        );
      }

      console.info("state:", ev.state);

      switch (ev.state) {
        case "NeedsLogin":
          if (!stopped) window.ipn.login();
          break;
        case "Running":
          tsProfiles = loadIpnProfiles();

          if (!tsProfiles.current) {
            throw new Error("Failed to load profile");
          }

          window.ipnProfile = tsProfiles.profiles[tsProfiles.current];

          if (!window.ipnProfile) {
            throw new Error("Failed to load profile");
          }

          if (loadingScreen) {
            unmount(loadingScreen);
            loadingScreen = undefined;
          }
          if (loginScreen) {
            unmount(loginScreen);
            loginScreen = undefined;
          }

          const component = getRouteComponent(routes, location.hash);

          app = mount(component, { target: appEl });

          break;
        case "Stopped":
          stopped = true;
          if (app) {
            await unmount(app);
            app = undefined;
          }
          break;
      }

      window.ipnEventHandler.addEventListener(
        window.ipnEventHandler.Events.netMap,
        (ev) => {
          if (!(ev instanceof window.ipnEventHandler.NotifyNetMapEvent)) {
            throw new Error(
              `Event payload for "${window.ipnEventHandler.Events.netMap}" is not instance of NotifyNetMapEvent`,
              { cause: ev }
            );
          }
          if (ev.netMapStr) netMap.set(JSON.parse(ev.netMapStr));
        }
      );
    }
  );

  window.ipn.run(window.ipnEventHandler);
})();

type Mount = { $set?: any; $on?: any } | undefined;
