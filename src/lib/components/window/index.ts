import type { CreateComponentOptions, IContentRenderer } from "dockview-core";

export { default as WindowSystem } from "./window-system.svelte";

import { XtermPanel } from "./panels/xterm";
import { NoVncPanel } from "./panels/novnc";
import { IronRdpPanel } from "./panels/ironrdp";
// import { MonacoPanel } from "./panels/monaco";

export { XtermPanel, NoVncPanel };

export function createComponent(opt: CreateComponentOptions): IContentRenderer {
  console.debug("createComponent:", opt);

  switch (opt.name) {
    case "xterm":
      return new XtermPanel();
    case "novnc":
      return new NoVncPanel();
    case "ironrdp":
      return new IronRdpPanel();
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
