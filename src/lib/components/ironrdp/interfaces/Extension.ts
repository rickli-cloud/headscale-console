// Copyright (c) Devolutions & contributors
// GitHub: Devolutions/IronRDP
// Source: https://github.com/Devolutions/IronRDP/blob/bdde2c76ded7315f7bc91d81a0909a1cb827d870/web-client/iron-remote-desktop/src/interfaces/Extension.ts

import type { ExtensionValue } from "./ExtensionValue";

export interface Extension {
  init(ident: string, value: unknown): ExtensionValue;
}
