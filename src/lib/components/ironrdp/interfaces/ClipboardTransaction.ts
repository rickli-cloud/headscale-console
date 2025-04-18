// Copyright (c) Devolutions & contributors
// GitHub: Devolutions/IronRDP
// Source: https://github.com/Devolutions/IronRDP/blob/bdde2c76ded7315f7bc91d81a0909a1cb827d870/web-client/iron-remote-desktop/src/interfaces/ClipboardTransaction.ts

import type { ClipboardContent } from "./ClipboardContent";

export interface ClipboardTransaction {
  init(): ClipboardTransaction;
  add_content(content: ClipboardContent): void;
  is_empty(): boolean;
  content(): Array<ClipboardContent>;
}
