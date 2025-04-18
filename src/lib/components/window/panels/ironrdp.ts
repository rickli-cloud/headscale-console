import type {
  GroupPanelPartInitParameters,
  IContentRenderer,
} from "dockview-core";
import { mount, unmount } from "svelte";

import {
  pkg,
  IronRdp,
  IronRdpLogin,
  SessionEventType,
  type NewSessionInfo,
  type UserInteraction,
} from "$lib/components/ironrdp";

import { IpnRawTcpChannel } from "$lib/api/tsconnect";

import { BasePanel } from "./base";

export interface IronRdpPanelParams {
  hostname: string;
  port: number;
}

export class IronRdpPanel extends BasePanel implements IContentRenderer {
  protected _userInteractionService: UserInteraction | undefined;
  protected _session: NewSessionInfo | undefined;
  protected rawChannel: IpnRawTcpChannel | undefined;
  protected mount: Mount | undefined;
  protected loginMount: Mount | undefined;

  // ironrdp_session::active_stage: Could not encode a resize: Display Control Virtual Channel is not available
  /* protected readonly resizeObserver = new ResizeObserver(() => {
    if (!this._userInteractionService) return;

    this._userInteractionService.resize(
      this._element.scrollWidth,
      this._element.scrollHeight
    );
  }); */

  get session() {
    return this._session;
  }

  public get userInteractionService() {
    return this._userInteractionService;
  }

  public async init({ params }: GroupPanelPartInitParameters): Promise<void> {
    const { hostname, port } = params as IronRdpPanelParams;

    // this.resizeObserver.observe(this._element);

    this.loginMount = mount(IronRdpLogin, {
      target: this._element,
      props: {
        onsubmit: (data) => {
          if (this.loginMount) unmount(this.loginMount);
          this.connect(data);
        },
        hostname,
        port,
      },
    });
  }

  public dispose(): void {
    if (this._userInteractionService) this._userInteractionService.shutdown();
    if (this.rawChannel) this.rawChannel.close();
    if (this.mount) unmount(this.mount);
    if (this.loginMount) unmount(this.loginMount);
  }

  public async connect(connectOpt: {
    serverDomain: string;
    username: string;
    password: string;
    hostname: string;
    port: number;
  }) {
    const { serverDomain, username, password, hostname, port } = connectOpt;

    this._element.addEventListener("ready", async (ev) => {
      const { detail } = ev as IronRdpReadyEvent;
      this._userInteractionService = detail?.irgUserInteraction;

      this._userInteractionService.onSessionEvent((ev) =>
        console.warn(
          `Session event: ${SessionEventType[ev.type]}\n${
            typeof ev.data === "string"
              ? ev.data
              : JSON.stringify(
                  { backtrace: ev.data.backtrace(), kind: ev.data.kind() },
                  null,
                  2
                )
          }`
        )
      );

      if (!this.rawChannel) return;

      this._session = await this._userInteractionService.connect({
        username,
        password,
        serverDomain,
        destination: `${hostname}:${port}`,
        dataChannel: this.rawChannel,
        desktopSize: new DesktopSize(
          this._element.scrollWidth,
          this._element.scrollHeight
        ),
        extensions: [],
      });

      this._userInteractionService.setVisibility(true);
    });

    this.rawChannel = await IpnRawTcpChannel.connect({
      hostname,
      port,
    }).catch((e) => {
      throw `Failed to connect: ` + e;
    });

    this.mount = mount(IronRdp, {
      target: this._element,
      props: {
        // TODO
        // @ts-expect-error
        module: pkg,
        debugwasm: import.meta.env.PROD ? "INFO" : "DEBUG",
        verbose: "true",
        scale: "real",
        flexcenter: "true",
      },
    });
  }
}

type Mount = Record<string, any>;

interface IronRdpReadyEvent extends Event {
  detail: {
    irgUserInteraction: UserInteraction;
  };
}

class DesktopSize {
  constructor(width: number, height: number) {
    this.height = height;
    this.width = width;
  }

  init(width: number, height: number): DesktopSize {
    return new DesktopSize(width, height);
  }

  height: number;
  width: number;
}
