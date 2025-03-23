import type {
  GroupPanelPartInitParameters,
  IContentRenderer,
} from "dockview-core";
import { mount } from "svelte";

import NodeInfo from "$lib/components/data/node/NodeInfo.svelte";

export class NodePanel implements IContentRenderer {
  protected readonly _element: HTMLElement;

  get element(): HTMLElement {
    return this._element;
  }

  constructor() {
    this._element = document.createElement("div");
    this.element.classList.add("h-full", "w-full");
  }

  init({ params }: GroupPanelPartInitParameters): void {
    mount(NodeInfo, {
      target: this.element,
      props: {
        peer: params.peer,
      },
    });
  }
}
