// Copyright (c) Devolutions & contributors
// GitHub: Devolutions/IronRDP
// Source: https://github.com/Devolutions/IronRDP/blob/bdde2c76ded7315f7bc91d81a0909a1cb827d870/web-client/iron-remote-desktop/src/interfaces/RemoteDesktopModule.ts

import type { DesktopSize } from "./DesktopSize";
import type { DeviceEvent } from "./DeviceEvent";
import type { InputTransaction } from "./InputTransaction";
import type { IronError } from "./session-event";
import type { Session } from "./Session";
import type { SessionBuilder } from "./SessionBuilder";
import type { SessionTerminationInfo } from "./SessionTerminationInfo";
import type { ClipboardTransaction } from "./ClipboardTransaction";
import type { ClipboardContent } from "./ClipboardContent";
import type { Extension } from "./Extension";

export interface RemoteDesktopModule {
  init: () => Promise<unknown>;
  iron_init: (logLevel: string) => void;
  DesktopSize: DesktopSize;
  DeviceEvent: DeviceEvent;
  InputTransaction: InputTransaction;
  IronError: IronError;
  Session: Session;
  SessionBuilder: SessionBuilder;
  SessionTerminationInfo: SessionTerminationInfo;
  ClipboardTransaction: ClipboardTransaction;
  ClipboardContent: ClipboardContent;
  Extension: Extension;
}
