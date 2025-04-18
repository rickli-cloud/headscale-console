import type { IContentRenderer } from "dockview-core";

export class BasePanel implements Partial<IContentRenderer> {
  protected readonly _element: HTMLElement;

  public readonly createdAt: Date = new Date(Date.now());

  get element(): HTMLElement {
    return this._element;
  }

  constructor() {
    this._element = document.createElement("div");
    this.element.classList.add("h-full", "w-full", "relative");
  }
}
