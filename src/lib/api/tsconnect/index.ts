// import { createIPN } from "@tailscale/connect";

import { ipnStateStorage } from "$lib/store/tailscale";
import { joinUrl } from "$lib/utils/misc";

import { createIPN } from "./pkg";

interface createTailscaleClientOptions {
  /** Used for loading main.wasm */
  baseUrl?: string | URL | Location;
  /** Tailscale control server URL */
  controlUrl: string;
  /** Optional authkey */
  authkey?: string;
}

export async function createTailscaleClient(
  opt: createTailscaleClientOptions
): Promise<IPN> {
  return createIPN({
    wasmURL: joinUrl(
      new URL(opt.baseUrl?.toString() || window.location.toString()),
      "tailscale.wasm"
    ),
    stateStorage: ipnStateStorage,
    panicHandler: (err) => console.error("IPN panic:", err),
    authKey: opt.authkey as string,
    controlURL: opt.controlUrl,
  });
}

export enum IpnEvents {
  browseToURL = "notifyBrowseToURL",
  netMap = "notifyNetMap",
  state = "notifyState",
  panicRecover = "notifyPanicRecover",
}

export class IpnEventHandler extends EventTarget implements IPNCallbacks {
  constructor() {
    super();
  }

  notifyBrowseToURL(url: string) {
    this.dispatchEvent(new NotifyBrowseToURLEvent(url));
  }

  notifyNetMap(netMapStr: string) {
    this.dispatchEvent(new NotifyNetMapEvent(netMapStr));
  }

  notifyState(state: IPNState) {
    this.dispatchEvent(new NotifyStateEvent(state));
  }

  notifyPanicRecover(err: string) {
    this.dispatchEvent(new NotifyPanicRecoverEvent(err));
  }
}

export class NotifyBrowseToURLEvent extends Event {
  public readonly url: string;
  constructor(url: string) {
    super(IpnEvents.browseToURL);
    this.url = url;
  }
}

export class NotifyNetMapEvent extends Event {
  public readonly netMapStr: string;
  constructor(netMapStr: string) {
    super(IpnEvents.netMap);
    this.netMapStr = netMapStr;
  }
}

export class NotifyStateEvent extends Event {
  public readonly state: IPNState;
  constructor(state: IPNState) {
    super(IpnEvents.state);
    this.state = state;
  }
}

export class NotifyPanicRecoverEvent extends Event {
  public readonly err: string;
  constructor(err: string) {
    super(IpnEvents.panicRecover);
    this.err = err;
  }
}
