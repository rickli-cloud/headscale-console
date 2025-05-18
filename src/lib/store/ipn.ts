import { get, writable } from "svelte/store";

import type { Ipn } from "$lib/types/ipn.d";
import { hex2a } from "$lib/utils/misc";
import { selfserviceCap, selfserviceHostname } from "./selfservice";
import { SelfService } from "$lib/api/self-service";
import { appConfig } from "./config";

const statePrefix = "ipn-state-";
const currentProfileKey = "_current-profile";
const profileRegex = new RegExp(`^${statePrefix}profile-`, "i");

export const netMap = writable<IPNNetMap | undefined>();

let selfserviceCapFetchLock = false;

netMap.subscribe(async (netMap) => {
  console.debug("netMap:", netMap);

  document.title = netMap?.domain || "";

  const selfservicePeer = netMap?.peers.filter(
    (peer) =>
      peer.online &&
      peer?.name &&
      peer.name.split(/\./)[0] === get(appConfig).selfserviceHostname
  )[0];

  let cap = get(selfserviceCap);

  if (!selfservicePeer) {
    if (cap) selfserviceCap.set(undefined);
    return;
  }

  selfserviceHostname.set(selfservicePeer.name);

  if (cap || selfserviceCapFetchLock) return;
  selfserviceCapFetchLock = true;
  try {
    cap = await SelfService.getCap();
    selfserviceCap.set(cap);
  } finally {
    selfserviceCapFetchLock = false;
  }
});

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
