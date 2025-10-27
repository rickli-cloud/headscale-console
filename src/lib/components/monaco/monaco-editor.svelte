<script lang="ts">
  import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
  import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
  import type { HTMLAttributes } from "svelte/elements";
  import { onDestroy, onMount } from "svelte";
  import * as monaco from "monaco-editor";
  import { mode } from "mode-watcher";

  import { monacoThemes } from "$lib/utils/monaco";
  import { cn } from "$lib/utils/shadcn";

  interface Props extends Partial<HTMLAttributes<HTMLDivElement>> {
    editor?: monaco.editor.IStandaloneCodeEditor | undefined;
    readonly?: boolean;
    observer?: ResizeObserver;
    onready?: (editor: monaco.editor.IStandaloneCodeEditor) => void;
  }

  let {
    editor = $bindable(),
    readonly = false,
    observer = new ResizeObserver((ev) => {
      editor?.layout({
        height: ev[0].contentRect.height,
        width: ev[0].contentRect.width,
      });
    }),
    onready,
    ...restProps
  }: Props = $props();

  let editorEl: HTMLDivElement;

  mode.subscribe((currentMode) => {
    console.debug({ currentMode });
    editor?.updateOptions({
      theme: currentMode === "dark" ? "customDark" : "customLight",
    });
  });

  onMount(async () => {
    self.MonacoEnvironment = {
      getWorker: function (_: any, label: string) {
        switch (label) {
          case "json":
            return new jsonWorker();
          default:
            return new editorWorker();
        }
      },
    };

    if (!editorEl) {
      throw new Error("Failed to bind editor: target element is undefined");
    }

    monaco.editor.defineTheme("customDark", monacoThemes.customDark);
    monaco.editor.defineTheme("customLight", monacoThemes.customLight);

    editor = monaco.editor.create(editorEl, {
      theme: $mode === "dark" ? "customDark" : "customLight",
      minimap: { enabled: true, autohide: "mouseover" },
      lineNumbers: "on",
      readOnly: readonly,
      wordWrap: "on",
      fontSize: 15,
      colorDecorators: true,
      automaticLayout: false,
    });

    if (typeof onready === "function") {
      onready(editor);
    }

    if (editorEl.parentElement) {
      observer.observe(editorEl.parentElement);
    }
  });

  onDestroy(() => {
    editor?.setModel(null);
    editor?.dispose();
    // monaco?.editor.getModels().forEach((model) => model.dispose());
  });
</script>

<div
  {...restProps}
  bind:this={editorEl}
  class={cn("h-full", restProps.class)}
></div>
