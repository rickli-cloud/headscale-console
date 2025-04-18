// Copyright (c) Devolutions & contributors
// GitHub: Devolutions/IronRDP
// Source: https://github.com/Devolutions/IronRDP/blob/bdde2c76ded7315f7bc91d81a0909a1cb827d870/web-client/iron-remote-desktop/src/interfaces/ResizeEvent.ts

import type { DesktopSize } from "./DesktopSize";

export interface ResizeEvent {
  session_id: number;
  desktop_size: DesktopSize;
}
