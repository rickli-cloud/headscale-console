// Copyright (c) Devolutions & contributors
// GitHub: Devolutions/IronRDP
// Source: https://github.com/Devolutions/IronRDP/blob/bdde2c76ded7315f7bc91d81a0909a1cb827d870/web-client/iron-remote-desktop/src/interfaces/session-event.ts

import type { SessionEventType } from "../enums/SessionEventType";

export enum IronErrorKind {
  General = 0,
  WrongPassword = 1,
  LogonFailure = 2,
  AccessDenied = 3,
  RDCleanPath = 4,
  ProxyConnect = 5,
}

export interface IronError {
  backtrace: () => string;
  kind: () => IronErrorKind;
}

export interface SessionEvent {
  type: SessionEventType;
  data: IronError | string;
}
