import { ModeWatcher } from "mode-watcher";
import { mount, unmount } from "svelte";

import { Toaster } from "$lib/components/ui/sonner";

import CriticalError from "$lib/components/error/CriticalError.svelte";

import { createClient, IpnEventHandler } from "$lib/api/tsconnect";
import { AppRouter, type AppRoute } from "$lib/utils/router";
import { loadIpnProfiles, netMap } from "$lib/store/ipn";
import { loadUserSettings } from "$lib/store/settings";
import { loadAppConfig } from "./lib/store/config";
import { errorToast } from "$lib/utils/error";
import type { Ipn } from "$lib/types/ipn.d";

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
  mount(Toaster, { target: document.body });

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
    routes,
  });

  let tsProfiles = loadIpnProfiles();

  window.ipnProfile = tsProfiles.current
    ? tsProfiles.profiles[tsProfiles.current]
    : undefined;

  window.ipn = await createClient({
    panicHandler: (err) => {
      stopped = true;
      console.error(err);
      unmountEverything();
      mount(CriticalError, {
        target: appEl,
        props: {
          error: err,
        },
      });
    },
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

      unmountEverything();

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

          unmountEverything();
          window.appRouter.resolve();

          break;
        case "Stopped":
          stopped = true;
          unmountEverything();
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

  window.ipnEventHandler.addEventListener(
    window.ipnEventHandler.Events.panicRecover,
    (ev) => {
      if (!(ev instanceof window.ipnEventHandler.NotifyPanicRecoverEvent)) {
        throw new Error(
          `Event payload for "${window.ipnEventHandler.Events.panicRecover}" is not instance of NotifyPanicRecoverEvent`,
          { cause: ev }
        );
      }
      errorToast("Panic Recover: " + ev.err);
    }
  );

  window.ipn.run(window.ipnEventHandler);

  function unmountEverything() {
    if (loadingScreen) {
      unmount(loadingScreen);
      loadingScreen = undefined;
    }
    if (loginScreen) {
      unmount(loginScreen);
      loginScreen = undefined;
    }
    window.appRouter.unmount();
  }
})();
