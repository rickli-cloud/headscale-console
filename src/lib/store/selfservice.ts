import { writable } from "svelte/store";

import { type SelfserviceCap } from "$lib/api/self-service";

export const selfserviceCap = writable<Partial<SelfserviceCap> | undefined>();

selfserviceCap.subscribe((cap) => console.debug("SelfserviceCap:", cap));
