import { ModeWatcher } from "mode-watcher";
import { mount, unmount } from "svelte";

import { Toaster } from "$lib/components/ui/sonner";

import { CriticalError } from "$lib/components/error";

import { createClient, IpnEventHandler } from "$lib/api/tsconnect";
import { ipnStatePrefix, loadIpnProfiles, netMap } from "$lib/store/ipn";
import { loadUserSettings } from "$lib/store/settings";
import { loadAppConfig } from "./lib/store/config";
import { AppRouter } from "$lib/utils/router";
import { errorToast } from "$lib/utils/error";

import routes from "$routes";

import "./app.css";

import LoadingScreen from "./LoadingScreen.svelte";
import NotFound from "./routes/404.svelte";
import LogoutScreen from "./LogoutScreen.svelte";

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

  let stopped: boolean = false;
  let loadingScreen: object | undefined = mount(LoadingScreen, {
    target: appEl,
  });

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
        console.error(err);
        await window.appRouter.unmount();
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
    window.ipnEventHandler.Events.state,
    async (ev) => {
      console.info("state:", ev.detail.state);
      switch (ev.detail.state) {
        case "NeedsLogin":
          if (stopped) break;

          Object.assign(window, { ipnProfiles: loadIpnProfiles() });

          if (loadingScreen) {
            await unmount(loadingScreen);
            loadingScreen = undefined;
          }

          window.appRouter.onResolve = () => "/_internal/auth";
          window.appRouter.resolve();

          if (!Object.keys(window.ipnProfiles.profiles).length) {
            window.ipn.login();
          }

          break;
        case "Running":
          Object.assign(window, { ipnProfiles: loadIpnProfiles() });

          if (
            !window.ipnProfiles.current ||
            !window.ipnProfiles.profiles[window.ipnProfiles.current]
          ) {
            throw new Error("Failed to load profile");
          }

          window.appRouter.onResolve = undefined;

          if (loadingScreen) {
            await unmount(loadingScreen);
            loadingScreen = undefined;
          }

          await window.appRouter.resolve();

          break;
        case "Stopped":
          stopped = true;

          await window.appRouter.unmount();

          delete window.localStorage[ipnStatePrefix + "_current-profile"];

          mount(LogoutScreen, { target: appEl });

          // window.location.reload();
          // await window.appRouter.unmount();
          // loadingScreen = mount(LoadingScreen, { target: appEl });
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
})();
