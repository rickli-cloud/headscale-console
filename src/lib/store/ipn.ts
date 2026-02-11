import { get, writable } from "svelte/store";

import type { Ipn } from "$lib/types/ipn.d";
import { Hex } from "$lib/utils/misc";

export const ipnStatePrefix = "ipn-state-";

const currentProfileKey = "_current-profile";
const profileRegex = new RegExp(`^${ipnStatePrefix}profile-[a-z,0-9]+`, "i");

export const netMap = writable<IPNNetMap | undefined>();

netMap.subscribe(async (netMap) => {
  console.debug("netMap:", netMap);
  document.title = netMap?.domain || "";
});

export class IpnStateStorage {
  public static setState(id: string, value: string) {
    window.localStorage[ipnStatePrefix + id] = value;
  }

  public static getState(id: string): string {
    return window.localStorage[ipnStatePrefix + id] || "";
  }
}

export function loadIpnProfiles(): {
  current?: string;
  profiles: { [profile: string]: Ipn.Profile };
  get currentProfile(): Ipn.Profile | undefined;
} {
  const profiles: { [profile: string]: Ipn.Profile } = {};

  let current: string | undefined = IpnStateStorage.getState(currentProfileKey);
  current = current.length ? Hex.decode(current) : undefined;

  for (const key in window.localStorage) {
    if (key !== null && profileRegex.test(key)) {
      try {
        const rawData = window.localStorage.getItem(key);
        if (rawData) {
          const name = key.replace(new RegExp(`^${ipnStatePrefix}`), "");
          profiles[name] = JSON.parse(Hex.decode(rawData));
        }
      } catch (e) {
        console.warn(`Failed to parse tailscale profile "${key}":`, e);
      }

      console.debug("found profile:", key);
    }
  }

  if (current && !profiles[current]) {
    console.warn(
      `Profile "${current}" is defined as currently selected but could not be found!`,
    );
    current = undefined;
  }

  return {
    profiles,
    current: current?.length ? current : undefined,
    get currentProfile() {
      if (!this.current) return undefined;
      return this.profiles[this.current];
    },
  };
}
