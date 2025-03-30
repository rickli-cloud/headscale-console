import type {
  GroupPanelPartInitParameters,
  IContentRenderer,
} from "dockview-core";
import * as monaco from "monaco-editor";
import { mount } from "svelte";

import { MonacoEditor } from "$lib/components/monaco";

import { BasePanel } from "./base";

export class MonacoPanel extends BasePanel implements IContentRenderer {
  protected readonly _editor: monaco.editor.IStandaloneCodeEditor | undefined;
  protected readonly _model: monaco.editor.ITextModel;

  constructor(lang: string) {
    super();

    this._model = monaco.editor.createModel("{}", lang);
  }

  public init({}: GroupPanelPartInitParameters): void {
    mount(MonacoEditor, {
      target: this.element,
      props: {
        editor: this._editor,
        onready: (editor) => editor.setModel(this._model),
      },
    });
  }

  public dispose(): void {
    this._editor?.dispose();
    this._model.dispose();
  }
}
