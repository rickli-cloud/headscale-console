// Copyright (c) Devolutions & contributors
// GitHub: Devolutions/IronRDP
// Source: https://github.com/Devolutions/IronRDP/blob/bdde2c76ded7315f7bc91d81a0909a1cb827d870/web-client/iron-remote-desktop-rdp/src/interfaces/Extension.ts
// Changes made:
// - Removed unused extension "pcb"

type ExtensionValue = { KdcProxyUrl: string } | { DisplayControl: boolean };

export class Extension {
  static init(ident: string, value: unknown): ExtensionValue {
    switch (ident) {
      case "KdcProxyUrl":
        if (typeof value === "string") {
          return { KdcProxyUrl: value };
        } else {
          throw new Error("KdcProxyUrl must be a string");
        }
      case "DisplayControl":
        if (typeof value === "boolean") {
          return { DisplayControl: value };
        } else {
          throw new Error("DisplayControl must be a boolean");
        }
      default:
        throw new Error(`Invalid extension type: ${ident}`);
    }
  }
}
