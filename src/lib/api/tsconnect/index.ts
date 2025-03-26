// import { createIPN } from "@tailscale/connect";

import { ipnStateStorage } from "$lib/store/tailscale";
import { joinUrl } from "$lib/utils/misc";

import "./tailscale.d";
import "./wasm_exec";

/**
 * Superset of the IPNConfig type, with additional configuration that is
 * needed for the package to function.
 */
export interface IPNPackageConfig extends IPNConfig {
  // Auth key used to initialize the Tailscale client (required)
  authKey?: string;
  // URL of the main.wasm file that is included in the page, if it is not
  // accessible via a relative URL.
  wasmURL?: string;
  // Function invoked if the Go process panics or unexpectedly exits.
  panicHandler: (err: string) => void;
}

export async function createTailscaleClient(opt: IPNPackageConfig) {
  const go = new Go();

  const wasmInstance = await WebAssembly.instantiateStreaming(
    fetch(
      opt.wasmURL?.length
        ? opt.wasmURL
        : joinUrl(new URL(window.location.toString()), "tailscale.wasm")
    ),
    go.importObject
  );

  // The Go process should never exit, if it does then it's an unhandled panic.
  go.run(wasmInstance.instance).then(() =>
    opt.panicHandler("Unexpected shutdown")
  );

  return newIPN({
    stateStorage: ipnStateStorage,
    ...opt,
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
