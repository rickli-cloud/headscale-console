import { mount, unmount } from "svelte";
import type { DockviewApi } from "dockview-core";
import { ModeWatcher } from "mode-watcher";

import { loadTailscaleProfiles, netMap } from "$lib/store/tailscale";
import type { Tailscale } from "$lib/types/tailscale";
import {
  createTailscaleClient,
  IpnEventHandler,
  IpnEvents,
  NotifyBrowseToURLEvent,
  NotifyNetMapEvent,
  NotifyStateEvent,
} from "$lib/api/tsconnect";

import "./app.css";
import App from "./App.svelte";
import LoginScreen from "./LoginScreen.svelte";
import LoadingScreen from "./LoadingScreen.svelte";

declare global {
  interface Window {
    ipn: IPN;
    dockView: DockviewApi;
    ipnEventHandler: IpnEventHandler;
    tailscaleProfile: Tailscale.Profile | undefined;
  }
}

(async () => {
  const appEl = document.getElementById("app")!;

  mount(ModeWatcher, { target: document.body });

  type Mount = { $set?: any; $on?: any } | undefined;
  let app: Mount;
  let loginScreen: Mount;
  let loadingScreen: Mount = mount(LoadingScreen, { target: appEl });
  let stopped = false;

  let tsProfiles = loadTailscaleProfiles();
  window.tailscaleProfile = tsProfiles.current
    ? tsProfiles.profiles[tsProfiles.current]
    : undefined;

  window.ipn = await createTailscaleClient({
    panicHandler: console.error,
    controlURL:
      import.meta.env.VITE_DEV_HEADSCALE_HOST ||
      window.tailscaleProfile?.ControlURL ||
      new URL("/", window.location.toString()).toString(),
  });

  window.ipnEventHandler = new IpnEventHandler();

  window.ipnEventHandler.addEventListener(IpnEvents.browseToURL, (ev) => {
    if (!(ev instanceof NotifyBrowseToURLEvent)) return;
    if (loadingScreen) {
      unmount(loadingScreen);
      loadingScreen = undefined;
    }
    loginScreen = mount(LoginScreen, { target: appEl, props: { url: ev.url } });
    window.open(ev.url, "_blank");
  });

  window.ipnEventHandler.addEventListener(IpnEvents.state, async (ev) => {
    if (!(ev instanceof NotifyStateEvent)) return;
    console.info("state:", ev.state);

    switch (ev.state) {
      case "NeedsLogin":
        if (!stopped) window.ipn.login();
        break;
      case "Running":
        tsProfiles = loadTailscaleProfiles();
        if (!tsProfiles.current) {
          throw new Error("Failed to load tailscale profile");
        }
        window.tailscaleProfile = tsProfiles.profiles[tsProfiles.current];
        if (!window.tailscaleProfile) {
          throw new Error("Failed to load tailscale profile");
        }

        if (loadingScreen) {
          unmount(loadingScreen);
          loadingScreen = undefined;
        }
        if (loginScreen) {
          unmount(loginScreen);
          loginScreen = undefined;
        }

        app = mount(App, { target: appEl });

        break;
      case "Stopped":
        stopped = true;
        if (app) {
          await unmount(app);
          app = undefined;
        }
        break;
    }

    window.ipnEventHandler.addEventListener(IpnEvents.netMap, (ev) => {
      if (!(ev instanceof NotifyNetMapEvent)) {
        throw new Error(
          `Event payload for "${IpnEvents.netMap}" is not instance of NotifyNetMapEvent`
        );
      }
      if (ev.netMapStr) netMap.set(JSON.parse(ev.netMapStr));
    });
  });

  window.ipn.run(window.ipnEventHandler);
})();
