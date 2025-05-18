import { writable } from "svelte/store";

import { type SelfserviceCap } from "$lib/api/self-service";

export const selfserviceCap = writable<Partial<SelfserviceCap> | undefined>();
export const selfserviceHostname = writable<string | undefined>();

selfserviceCap.subscribe((cap) => console.debug("SelfserviceCap:", cap));
selfserviceHostname.subscribe((hostname) =>
  console.debug("SelfserviceHostname:", hostname)
);
