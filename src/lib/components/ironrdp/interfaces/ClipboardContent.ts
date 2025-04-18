// Copyright (c) Devolutions & contributors
// GitHub: Devolutions/IronRDP
// Source: https://github.com/Devolutions/IronRDP/blob/bdde2c76ded7315f7bc91d81a0909a1cb827d870/web-client/iron-remote-desktop/src/interfaces/ClipboardContent.ts

export interface ClipboardContent {
  new_text(mime_type: string, text: string): ClipboardContent;
  new_binary(mime_type: string, binary: Uint8Array): ClipboardContent;
  mime_type(): string;
  value(): string;
}
