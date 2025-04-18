// import { createIPN } from "@tailscale/connect";

import { IpnStateStorage } from "$lib/store/ipn";
import { joinUrl } from "$lib/utils/misc";

import "./tsconnect.d";
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

export async function createClient(opt: IPNPackageConfig) {
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
    stateStorage: IpnStateStorage,
    ...opt,
  });
}

export class IpnEventHandler extends EventTarget implements IPNCallbacks {
  Events = IpnEvents;
  NotifyBrowseToURLEvent = NotifyBrowseToURLEvent;
  NotifyNetMapEvent = NotifyNetMapEvent;
  NotifyStateEvent = NotifyStateEvent;
  NotifyPanicRecoverEvent = NotifyPanicRecoverEvent;

  public constructor() {
    super();
  }

  public notifyBrowseToURL(url: string) {
    this.dispatchEvent(new NotifyBrowseToURLEvent(url));
  }

  public notifyNetMap(netMapStr: string) {
    this.dispatchEvent(new NotifyNetMapEvent(netMapStr));
  }

  public notifyState(state: IPNState) {
    this.dispatchEvent(new NotifyStateEvent(state));
  }

  public notifyPanicRecover(err: string) {
    this.dispatchEvent(new NotifyPanicRecoverEvent(err));
  }
}

enum IpnEvents {
  browseToURL = "notifyBrowseToURL",
  netMap = "notifyNetMap",
  state = "notifyState",
  panicRecover = "notifyPanicRecover",
}

class NotifyBrowseToURLEvent extends Event {
  public readonly url: string;

  constructor(url: string) {
    super(IpnEvents.browseToURL);
    this.url = url;
  }
}

class NotifyNetMapEvent extends Event {
  public readonly netMapStr: string;

  constructor(netMapStr: string) {
    super(IpnEvents.netMap);
    this.netMapStr = netMapStr;
  }
}

class NotifyStateEvent extends Event {
  public readonly state: IPNState;

  constructor(state: IPNState) {
    super(IpnEvents.state);
    this.state = state;
  }
}

class NotifyPanicRecoverEvent extends Event {
  public readonly err: string;

  constructor(err: string) {
    super(IpnEvents.panicRecover);
    this.err = err;
  }
}

export class IpnRawTcpChannel extends EventTarget implements RTCDataChannel {
  public static async connect(
    opt: Omit<Parameters<typeof window.ipn.tcp>[0], "readCallback">
  ): Promise<IpnRawTcpChannel> {
    const wrapper = new IpnRawTcpChannel(
      await window.ipn.tcp({
        readBufferSizeInBytes: 4 * 1024 * 1024,
        ...opt,
        readCallback: (data) => {
          // console.debug("IpnRawTcpChannel readCallback:", wrapper.onmessage, data, stringifyBuffer(data));
          wrapper.onmessage?.({ data });
        },
      })
    );

    return wrapper;
  }

  public readonly id: number | null = null;
  public readonly maxPacketLifeTime: number | null = null;
  public readonly maxRetransmits: number | null = null;
  public readonly bufferedAmount: number = 0;
  public readonly bufferedAmountLowThreshold: number = 0;
  public readonly negotiated: boolean = false;
  public readonly onbufferedamountlow: null = null;
  public readonly ordered: boolean = false;
  public readonly onopen: null = null;
  public readonly onerror: null = null;
  public readonly onclose: null = null;
  public readonly label: string = "IpnRawTcpChannel";
  public readonly binaryType: "arraybuffer" = "arraybuffer";
  public readonly readyState: "open" = "open";
  public readonly protocol: "wss" = "wss";

  public onclosing = () => {
    console.debug("TCP session closing");
  };

  public onmessage: (e: { data: Uint8Array }) => void = () => {};

  protected readonly tcp: IPNTCPSession;

  protected constructor(tcp: IPNTCPSession) {
    super();

    this.tcp = tcp;
  }

  public send(data: unknown): void {
    if (!(data instanceof Uint8Array)) {
      console.error("IpnRawTcpChannel data is not type of Uint8Array!");
      return;
    }
    // console.debug("IpnRawTcpChannel send", data, stringifyBuffer(data));
    this.tcp.write(data);
  }

  public close(): void {
    this.tcp.close();
  }
}

// let test = await IpnRawTcpChannel.connect({ hostname: "", port: 0 });
// test.addEventListener;

/* function stringifyBuffer(data: Uint8Array) {
  return (
    "\n[ " +
    (JSON.parse(`[${data?.toString()}]`) as number[])
      .map((i) => i.toString(16))
      .map((i) => (String(i).length === 1 ? "0" : "") + String(i))
      .join(" ") +
    " ]\n" +
    new TextDecoder().decode(data)
  );
} */
