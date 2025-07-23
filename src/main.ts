import { ModeWatcher } from "mode-watcher";
import { mount, unmount } from "svelte";

import { Toaster } from "$lib/components/ui/sonner";

import { CriticalError } from "$lib/components/error";

import { createClient, IpnEventHandler } from "$lib/api/tsconnect";
import { loadIpnProfiles, netMap } from "$lib/store/ipn";
import { loadUserSettings } from "$lib/store/settings";
import { loadAppConfig } from "./lib/store/config";
import { AppRouter } from "$lib/utils/router";
import { errorToast } from "$lib/utils/error";

import routes from "$routes";

import "./app.css";

import LoadingScreen from "./LoadingScreen.svelte";
import LoginScreen from "./LoginScreen.svelte";
import NotFound from "./routes/404.svelte";

declare global {
  interface Window {
    readonly appRouter: AppRouter;
    readonly ipn: IPN;
    readonly ipnEventHandler: IpnEventHandler;
    readonly ipnProfiles: ReturnType<typeof loadIpnProfiles>;
  }
}

(async () => {
  mount(ModeWatcher, { target: document.body });
  mount(Toaster, { target: document.body });

  const appEl = document.getElementById("app");
  if (!appEl) {
    throw new Error("Failed to get HTML element #app");
  }

  let stopped = false;
  const mounts: {
    loadingScreen: object | undefined;
    loginScreen: object | undefined;
  } = {
    loadingScreen: mount(LoadingScreen, { target: appEl }),
    loginScreen: undefined,
  };

  const params = new URLSearchParams(window.location.search);
  const authKey = params.get("k") || undefined;
  const paramsTags = params.get("t") || undefined;

  Object.assign(window, { ipnProfiles: loadIpnProfiles() });

  const cfg = await loadAppConfig();

  loadUserSettings(cfg.defaults);

  Object.assign(window, {
    ipnEventHandler: new IpnEventHandler(),
    ipn: await createClient({
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
    }),
    appRouter: new AppRouter({
      target: appEl,
      fallbackComponent: NotFound,
      routes,
    }),
  });

  window.ipnEventHandler.addEventListener(
    window.ipnEventHandler.Events.browseToURL,
    async (ev) => {
      try {
        await unmountEverything();
        mounts.loginScreen = mount(LoginScreen, {
          target: appEl,
          props: { url: ev.detail.url },
        });
      } catch (err) {
        console.error(err);
        errorToast(`Failed to handle browseToURL event: ${err?.toString()}`);
      }
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
          Object.assign(window, { ipnProfiles: loadIpnProfiles() });

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
      try {
        if (typeof ev.detail.netMapStr !== "string") return;
        netMap.set(JSON.parse(ev.detail.netMapStr));
      } catch (err) {
        console.error(err);
        errorToast(`Failed to parse NetMap: ${err?.toString()}`);
      }
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
    if (mounts.loadingScreen) {
      await unmount(mounts.loadingScreen);
      delete mounts.loadingScreen;
    }
    if (mounts.loginScreen) {
      await unmount(mounts.loginScreen);
      delete mounts.loginScreen;
    }
    window.appRouter.unmount();
  }
})();
