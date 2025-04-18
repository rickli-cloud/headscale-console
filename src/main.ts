import type { DockviewApi } from "dockview-core";
import { ModeWatcher } from "mode-watcher";
import { mount, unmount } from "svelte";

import { createClient, IpnEventHandler } from "$lib/api/tsconnect";
import { loadIpnProfiles, netMap } from "$lib/store/ipn";
import type { Ipn } from "$lib/types/ipn.d";

import "./app.css";
import App from "./App.svelte";
import LoginScreen from "./LoginScreen.svelte";
import LoadingScreen from "./LoadingScreen.svelte";

declare global {
  interface Window {
    ipn: IPN;
    dockView: DockviewApi;
    ipnEventHandler: IpnEventHandler;
    ipnProfile: Ipn.Profile | undefined;
  }
}

(async () => {
  const appEl = document.getElementById("app")!;

  mount(ModeWatcher, { target: document.body });

  let loadingScreen: Mount = mount(LoadingScreen, { target: appEl });

  let app: Mount;
  let loginScreen: Mount;
  let stopped = false;

  let tsProfiles = loadIpnProfiles();

  window.ipnProfile = tsProfiles.current
    ? tsProfiles.profiles[tsProfiles.current]
    : undefined;

  window.ipn = await createClient({
    panicHandler: console.error,
    routeAll: true,
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

      window.open(ev.url, "_blank");
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
