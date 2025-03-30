import type { Tailscale } from "$lib/types/tailscale.d";
import { hex2a } from "$lib/utils/misc";
import { writable } from "svelte/store";

const statePrefix = "ipn-state-";
const currentProfileKey = "_current-profile";
const profileRegex = new RegExp(`^${statePrefix}profile-`, "i");

export const netMap = writable<Tailscale.NetMap | undefined>(undefined);

netMap.subscribe((netMap) => console.debug("netMap:", netMap));

export const ipnStateStorage: NonNullable<IPNStateStorage> = {
  setState(id: string, value: string) {
    window.localStorage[statePrefix + id] = value;
  },
  getState(id: string): string {
    return window.localStorage[statePrefix + id] || "";
  },
};

export function loadTailscaleProfiles(): {
  current?: string;
  profiles: { [profile: string]: Tailscale.Profile };
} {
  const profiles: { [profile: string]: Tailscale.Profile } = {};
  let current: string | undefined = ipnStateStorage.getState(currentProfileKey);
  current = current.length ? hex2a(current) : undefined;

  if (current?.length) {
    for (const key in window.localStorage) {
      if (key !== null && profileRegex.test(key)) {
        try {
          const rawData = window.localStorage.getItem(key);
          if (rawData) {
            const name = key.replace(new RegExp(`^${statePrefix}`), "");
            profiles[name] = JSON.parse(hex2a(rawData));
          }
        } catch (e) {
          console.warn(`Failed to parse tailscale profile "${key}":`, e);
        }

        console.debug("found profile:", key);
      }
    }
  }

  if (current && !profiles[current]) {
    console.warn(
      `Profile "${current}" is defined as currently selected but could not be found!`
    );
    current = undefined;
  }

  return {
    current: current?.length ? current : undefined,
    profiles,
  };
}
