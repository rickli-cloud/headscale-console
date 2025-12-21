/// <reference lib="webworker" />
declare let self: ServiceWorkerGlobalScope;

import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";
// import { registerRoute } from "workbox-routing";

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
