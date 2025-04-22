import { writable } from "svelte/store";

import type { Ipn } from "$lib/types/ipn.d";
import { hex2a } from "$lib/utils/misc";

const statePrefix = "ipn-state-";
const currentProfileKey = "_current-profile";
const profileRegex = new RegExp(`^${statePrefix}profile-`, "i");

export const netMap = writable<IPNNetMap | undefined>(undefined);

netMap.subscribe((netMap) => console.debug("netMap:", netMap));

export class IpnStateStorage {
  public static setState(id: string, value: string) {
    window.localStorage[statePrefix + id] = value;
  }

  public static getState(id: string): string {
    return window.localStorage[statePrefix + id] || "";
  }
}

export function loadIpnProfiles(): {
  current?: string;
  profiles: { [profile: string]: Ipn.Profile };
} {
  const profiles: { [profile: string]: Ipn.Profile } = {};

  let current: string | undefined = IpnStateStorage.getState(currentProfileKey);
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
