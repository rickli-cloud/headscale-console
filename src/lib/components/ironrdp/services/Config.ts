// Copyright (c) Devolutions & contributors
// GitHub: Devolutions/IronRDP
// Source: https://github.com/Devolutions/IronRDP/blob/bdde2c76ded7315f7bc91d81a0909a1cb827d870/web-client/iron-remote-desktop/src/services/Config.ts

import type { DesktopSize } from "../interfaces/DesktopSize";
import type { ExtensionValue } from "../interfaces/ExtensionValue";

export class Config {
  readonly dataChannel: RTCDataChannel;
  readonly username: string;
  readonly password: string;
  readonly destination: string;
  readonly serverDomain: string;
  readonly desktopSize?: DesktopSize;
  readonly extensions: ExtensionValue[];

  constructor(
    dataChannel: RTCDataChannel,
    userData: { username: string; password: string },
    configOptions: {
      destination: string;
      serverDomain: string;
      extensions: ExtensionValue[];
      desktopSize?: DesktopSize;
    }
  ) {
    this.dataChannel = dataChannel;
    this.username = userData.username;
    this.password = userData.password;
    this.destination = configOptions.destination;
    this.serverDomain = configOptions.serverDomain;
    this.extensions = configOptions.extensions;
    this.desktopSize = configOptions.desktopSize;
  }
}
