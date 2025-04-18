// Copyright (c) Devolutions & contributors
// GitHub: Devolutions/IronRDP
// Source: https://github.com/Devolutions/IronRDP/blob/bdde2c76ded7315f7bc91d81a0909a1cb827d870/web-client/iron-remote-desktop/src/interfaces/UserInteraction.ts

import type { ScreenScale } from "../enums/ScreenScale";
import type { NewSessionInfo } from "./NewSessionInfo";
import type { SessionEvent } from "./session-event";
import type { Config } from "../services/Config";
import { ConfigBuilder } from "../services/ConfigBuilder";

export interface UserInteraction {
  setVisibility(state: boolean): void;

  setScale(scale: ScreenScale): void;

  configBuilder(): ConfigBuilder;

  connect(config: Config): Promise<NewSessionInfo>;

  setKeyboardUnicodeMode(use_unicode: boolean): void;

  ctrlAltDel(): void;

  metaKey(): void;

  shutdown(): void;

  setCursorStyleOverride(style: string | null): void;

  onSessionEvent(callback: (event: SessionEvent) => void): void;

  resize(width: number, height: number, scale?: number): void;

  setEnableClipboard(enable: boolean): void;
}
