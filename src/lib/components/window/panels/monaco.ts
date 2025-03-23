import type {
  GroupPanelPartInitParameters,
  IContentRenderer,
} from "dockview-core";
import * as monaco from "monaco-editor";
import { mount } from "svelte";

import { MonacoEditor } from "$lib/components/monaco";

export class MonacoPanel implements IContentRenderer {
  protected readonly _element: HTMLElement;
  protected readonly _editor: monaco.editor.IStandaloneCodeEditor | undefined;
  protected readonly _model: monaco.editor.ITextModel;

  get element(): HTMLElement {
    return this._element;
  }

  constructor(lang: string) {
    this._element = document.createElement("div");
    this.element.classList.add("h-full", "w-full", "py-3");

    this._model = monaco.editor.createModel("{}", lang);
  }

  init(parameters: GroupPanelPartInitParameters): void {
    mount(MonacoEditor, {
      target: this.element,
      props: {
        editor: this._editor,
        onready: (editor) => editor.setModel(this._model),
      },
    });
  }
}
