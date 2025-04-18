// Copyright (c) Devolutions & contributors
// GitHub: Devolutions/IronRDP
// Source: https://github.com/Devolutions/IronRDP/blob/bdde2c76ded7315f7bc91d81a0909a1cb827d870/web-client/iron-remote-desktop-rdp/src/main.ts

import {
  default as init,
  iron_init,
  DesktopSize,
  DeviceEvent,
  InputTransaction,
  IronError,
  Session,
  SessionBuilder,
  SessionTerminationInfo,
  ClipboardTransaction,
  ClipboardContent,
} from "$pkg/ironrdp";

import { Extension } from "./interfaces/Extension";

export default {
  init,
  iron_init,
  DesktopSize,
  DeviceEvent,
  InputTransaction,
  IronError,
  SessionBuilder,
  ClipboardTransaction,
  ClipboardContent,
  Session,
  SessionTerminationInfo,
  Extension,
};
