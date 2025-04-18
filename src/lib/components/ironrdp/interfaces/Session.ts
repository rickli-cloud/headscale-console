// Copyright (c) Devolutions & contributors
// GitHub: Devolutions/IronRDP
// Source: https://github.com/Devolutions/IronRDP/blob/bdde2c76ded7315f7bc91d81a0909a1cb827d870/web-client/iron-remote-desktop/src/interfaces/Session.ts

import type { InputTransaction } from "./InputTransaction";
import type { DesktopSize } from "./DesktopSize";
import type { SessionTerminationInfo } from "./SessionTerminationInfo";
import type { ClipboardTransaction } from "./ClipboardTransaction";

export interface Session {
  run(): Promise<SessionTerminationInfo>;
  desktop_size(): DesktopSize;
  apply_inputs(transaction: InputTransaction): void;
  release_all_inputs(): void;
  synchronize_lock_keys(
    scroll_lock: boolean,
    num_lock: boolean,
    caps_lock: boolean,
    kana_lock: boolean
  ): void;
  extension_call(value: unknown): unknown;
  shutdown(): void;
  on_clipboard_paste(content: ClipboardTransaction): Promise<void>;
  resize(
    width: number,
    height: number,
    scale_factor?: number | null,
    physical_width?: number | null,
    physical_height?: number | null
  ): void;
  supports_unicode_keyboard_shortcuts(): boolean;
}
