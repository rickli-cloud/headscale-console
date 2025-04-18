import NoVncClient from "@novnc/novnc/lib/rfb";
import { mount, unmount } from "svelte";
import type {
  GroupPanelPartInitParameters,
  IContentRenderer,
} from "dockview-core";

import { NoVncLogin } from "$lib/components/novnc";

import { IpnRawTcpChannel } from "$lib/api/tsconnect";

import { BasePanel } from "./base";

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

    this.rawChannel = await IpnRawTcpChannel.connect(opt);

    this.noVncClient = new NoVncClient(el, this.rawChannel, {
      credentials: { ...opt, target: "" },
    });

    this.noVncClient.scaleViewport = true;
    this.noVncClient.resizeSession = true;
  }
}

type Mount = Record<string, any>;
