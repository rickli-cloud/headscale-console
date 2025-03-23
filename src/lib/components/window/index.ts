import type { CreateComponentOptions, IContentRenderer } from "dockview-core";

export { default as WindowSystem } from "./window-system.svelte";

import { XtermPanel } from "./panels/xterm";
import { MonacoPanel } from "./panels/monaco";
import { NodePanel } from "./panels/node";

export { XtermPanel, MonacoPanel, NodePanel };

export function createComponent(opt: CreateComponentOptions): IContentRenderer {
  console.debug("createComponent:", opt);

  switch (opt.name) {
    case "xterm":
      return new XtermPanel();
    case "node":
      return new NodePanel();
    default:
      return {
        element: document.createElement("div"),
        init() {
          console.error(
            `Window with unkown component "${opt.name}" was created`
          );
        },
      };
  }
}
