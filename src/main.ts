import { ModeWatcher } from "mode-watcher";
import { mount, unmount } from "svelte";

import { Toaster } from "$lib/components/ui/sonner";

import { CriticalError } from "$lib/components/error";

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
    ipnProfiles: {
      current?: string;
      profiles: { [profile: string]: Ipn.Profile };
      get currentProfile(): Ipn.Profile | undefined;
    };
    ipnEventHandler: IpnEventHandler;
    appRouter: AppRouter;
  }
}

const routes: AppRoute[] = [
  { path: /^\/?$/, component: App },
  { path: /^\/?connect\/?$/, component: Connect },
];

(async () => {
  const appEl = document.getElementById("app");
  if (!appEl) {
    throw new Error("Failed to get HTML element #app");
  }

  mount(ModeWatcher, { target: document.body });
  mount(Toaster, { target: document.body });

  let loadingScreen: object | undefined = mount(LoadingScreen, {
    target: appEl,
  });
  let loginScreen: object | undefined;

  let stopped = false;

  let params = new URLSearchParams(window.location.search);

  let authKey = params.get("k") || undefined;
  let paramsTags = params.get("t") || undefined;

  let cfg = await loadAppConfig();

  loadUserSettings(cfg.defaults);

  window.appRouter = new AppRouter({
    target: appEl,
    fallbackComponent: NotFound,
    routes,
  });

  window.ipnProfiles = {
    ...loadIpnProfiles(),
    get currentProfile() {
      if (!this.current) return undefined;
      return this.profiles[this.current];
    },
  };

  window.ipn = await createClient({
    panicHandler: async (err) => {
      stopped = true;
      console.error(err);
      await unmountEverything();
      mount(CriticalError, {
        target: appEl,
        props: { error: err },
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
    async (ev) => {
      await unmountEverything();
      loginScreen = mount(LoginScreen, {
        target: appEl,
        props: { url: ev.detail.url },
      });
    }
  );

  window.ipnEventHandler.addEventListener(
    window.ipnEventHandler.Events.state,
    async (ev) => {
      console.info("state:", ev.detail.state);
      switch (ev.detail.state) {
        case "NeedsLogin":
          if (stopped) break;
          window.ipn.login();
          break;
        case "Running":
          window.ipnProfiles = {
            ...loadIpnProfiles(),
            get currentProfile() {
              if (!this.current) return undefined;
              return this.profiles[this.current];
            },
          };

          if (
            !window.ipnProfiles.current ||
            !window.ipnProfiles.profiles[window.ipnProfiles.current]
          ) {
            throw new Error("Failed to load profile");
          }

          await unmountEverything();
          await window.appRouter.resolve();

          break;
        case "Stopped":
          stopped = true;
          await unmountEverything();
          break;
      }
    }
  );

  window.ipnEventHandler.addEventListener(
    window.ipnEventHandler.Events.netMap,
    (ev) => {
      if (ev.detail.netMapStr) netMap.set(JSON.parse(ev.detail.netMapStr));
    }
  );

  window.ipnEventHandler.addEventListener(
    window.ipnEventHandler.Events.panicRecover,
    (ev) => {
      errorToast("Panic Recover: " + ev.detail.err);
    }
  );

  window.ipn.run(window.ipnEventHandler);

  async function unmountEverything() {
    if (loadingScreen) {
      await unmount(loadingScreen);
      loadingScreen = undefined;
    }
    if (loginScreen) {
      await unmount(loginScreen);
      loginScreen = undefined;
    }
    window.appRouter.unmount();
  }
})();
