import { registerSW } from "virtual:pwa-register";

import toast from "$lib/utils/toast";

export function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    const reload = registerSW({
      onRegisterError: (err) => {
        console.error("Failed to register Service Worker:", err);
        toast.error("Failed to register Service Worker: " + err?.toString());
      },

      onNeedRefresh: () => {
        toast.info("A new version is available!", {
          duration: 99999999999999,
          action: {
            label: "RELOAD",
            onClick: async () => await reload(true),
          },
        });
      },

      onRegisteredSW: (_, reg) => {
        if (reg) reg.onupdatefound = async () => await reg.update();
      },
    });
  }
}
