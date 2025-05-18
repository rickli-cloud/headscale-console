import { ModeWatcher } from "mode-watcher";
import { mount, unmount } from "svelte";

import { createClient, IpnEventHandler } from "$lib/api/tsconnect";
import { loadIpnProfiles, netMap } from "$lib/store/ipn";
import { loadAppConfig } from "./lib/store/config";
import type { Ipn } from "$lib/types/ipn.d";
import { AppRouter, type AppRoute } from "$lib/utils/router";

import "./app.css";

import LoadingScreen from "./LoadingScreen.svelte";
import LoginScreen from "./LoginScreen.svelte";
import Connect from "./Connect.svelte";
import NotFound from "./404.svelte";
import App from "./App.svelte";
import { loadUserSettings } from "$lib/store/settings";

declare global {
  interface Window {
    ipn: IPN;
    ipnProfile: Ipn.Profile | undefined;
    ipnEventHandler: IpnEventHandler;
    appRouter: AppRouter;
  }
}

const routes: AppRoute[] = [
  { path: /^\/?$/, component: App },
  { path: /^\/?connect\/?$/, component: Connect },
];

type Mount = object;

(async () => {
  const appEl = document.getElementById("app");
  if (!appEl) {
    throw new Error("Failed to get HTML element #app");
  }

  mount(ModeWatcher, { target: document.body });

  let loadingScreen: Mount | undefined = mount(LoadingScreen, {
    target: appEl,
  });
  let loginScreen: Mount | undefined;

  let stopped = false;

  let params = new URLSearchParams(window.location.search);

  let authKey = params.get("k") || undefined;
  if (authKey) authKey = decodeURIComponent(authKey);

  let paramsTags = params.get("t") || undefined;
  if (paramsTags) paramsTags = decodeURIComponent(paramsTags);

  let cfg = await loadAppConfig();

  loadUserSettings(cfg.defaults);

  window.appRouter = new AppRouter({
    target: appEl,
    fallbackComponent: NotFound,
  });
  for (const route of routes) {
    window.appRouter.routes.push(route);
  }

  let tsProfiles = loadIpnProfiles();

  window.ipnProfile = tsProfiles.current
    ? tsProfiles.profiles[tsProfiles.current]
    : undefined;

  window.ipn = await createClient({
    panicHandler: console.error,
    routeAll: true,
    authKey,
    controlURL: cfg.controlUrl,
    advertiseTags: [...(paramsTags || []), ...cfg.tags].join(";"),
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
      if (loginScreen) {
        unmount(loginScreen);
        loginScreen = undefined;
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
          if (stopped) break;
          window.ipn.login();
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

          window.appRouter.resolve();

          // const component = getRouteComponent(routes, location.hash);
          // app = mount(component, { target: appEl });

          break;
        case "Stopped":
          stopped = true;
          window.appRouter.unmount();
          break;
      }
    }
  );

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

  window.ipn.run(window.ipnEventHandler);
})();
