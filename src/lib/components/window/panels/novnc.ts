import type {
  GroupPanelPartInitParameters,
  IContentRenderer,
} from "dockview-core";
import NoVncClient from "@novnc/novnc/lib/rfb";

import { BasePanel } from "./base";
import { mount, unmount } from "svelte";
import { NoVncLogin } from "$lib/components/novnc";

export interface NoVNCPanelParams {
  hostname: string;
  port: number;
}

export class NoVncPanel extends BasePanel implements IContentRenderer {
  protected rawChannel: IpnRawTcpChannel | undefined;
  protected noVncClient: NoVncClient | undefined;
  protected loginMount: Mount | undefined;

  constructor() {
    super();
  }

  public init({ params }: GroupPanelPartInitParameters): void {
    const { hostname, port } = params as NoVNCPanelParams;

    this.loginMount = mount(NoVncLogin, {
      target: this._element,
      props: {
        onsubmit: (opt) => this.connect(opt, this._element),
        hostname,
        port,
      },
    });
  }

  public dispose(): void {
    this.noVncClient?.disconnect();
    this.rawChannel?.close();
  }

  public async connect(
    opt: {
      username: string;
      password: string;
      hostname: string;
      port: number;
    },
    el: HTMLElement
  ) {
    if (this.loginMount) unmount(this.loginMount);

    this.rawChannel = await IpnRawTcpChannel.connect(opt.hostname, opt.port);

    this.noVncClient = new NoVncClient(el, this.rawChannel, {
      credentials: { ...opt, target: "" },
    });

    this.noVncClient.scaleViewport = true;
    this.noVncClient.resizeSession = true;
  }
}

class IpnRawTcpChannel extends EventTarget implements RTCDataChannel {
  public static async connect(
    hostname: string,
    port: number
  ): Promise<IpnRawTcpChannel> {
    const wrapper = new IpnRawTcpChannel(
      await window.ipn.tcp({
        hostname,
        port,
        readCallback: (data) => wrapper.onmessage({ data }),
        readBufferSizeInBytes: 4 * 1024 * 1024,
      })
    );

    return wrapper;
  }

  public id: number | null = null;
  public label: string = "IpnRawTcpChannel";
  public maxPacketLifeTime: number | null = null;
  public maxRetransmits: number | null = null;
  public bufferedAmount: number = 0;
  public bufferedAmountLowThreshold: number = 0;
  public onbufferedamountlow: null = null;
  public negotiated: boolean = false;
  public ordered: boolean = false;
  public onclosing() {}
  public onopen: null = null;
  public onerror: null = null;
  public onclose: null = null;
  public binaryType: "arraybuffer" = "arraybuffer";
  public protocol: "wss" = "wss";
  public readyState: "open" = "open";

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
    this.tcp.write(data);
  }

  public close(): void {
    this.tcp.close();
  }
}

type Mount = Record<string, any>;
