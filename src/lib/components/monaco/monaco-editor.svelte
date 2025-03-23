<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import { onDestroy, onMount } from "svelte";
  import * as monaco from "monaco-editor";
  import { mode } from "mode-watcher";

  import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
  import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
  import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
  import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";
  import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";
  import { cn } from "$lib/utils/shadcn";

  interface Props extends Partial<HTMLAttributes<HTMLDivElement>> {
    editor: monaco.editor.IStandaloneCodeEditor | undefined;
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

  const themes: {
    [x: string]: monaco.editor.IStandaloneThemeData;
  } = {
    customDark: {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "888888" },
        { token: "string", foreground: "ce9178" },
      ],
      colors: {
        // 'editor.foreground': '#FFFFFF',
        "editor.background": "#0a0a0a",
        // 'editor.selectionBackground': '#2a2a2b',
        // 'editor.lineHighlightBackground': '#2a2a2b',
        // 'editorCursor.foreground': '#FFFFFF',
        // 'editorWhitespace.foreground': '#FFFFFF'
      },
    },

    customLight: {
      base: "vs",
      inherit: true,
      rules: [
        { token: "comment", foreground: "888888" },
        { token: "string", foreground: "ce9178" },
      ],
      colors: {
        // 'editor.foreground': '#000000',
        "editor.background": "#FFFFFF",
        // 'editor.selectionBackground': '#FEFEFE',
        // 'editor.lineHighlightBackground': '#FEFEFE',
        // 'editorCursor.foreground': '#000000',
        // 'editorWhitespace.foreground': '#000000'
      },
    },
  };

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
          case "css":
            return new cssWorker();
          case "html":
            return new htmlWorker();
          case "javscript":
            return new tsWorker();
          case "typescript":
            return new tsWorker();
          default:
            return new editorWorker();
        }
      },
    };

    monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);

    if (!editorEl) {
      throw new Error("Failed to bind editor: target element is undefined");
    }

    monaco.editor.defineTheme("customDark", themes.customDark);
    monaco.editor.defineTheme("customLight", themes.customLight);

    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      allowComments: true,
      trailingCommas: "ignore",
    });

    editor = monaco.editor.create(editorEl, {
      automaticLayout: false,
      colorDecorators: true,
      theme: $mode === "dark" ? "customDark" : "customLight",
      minimap: { enabled: true, autohide: true },
      lineNumbers: "off",
      readOnly: readonly,
      wordWrap: "on",
      fontSize: 15,
    });

    if (typeof onready === "function") {
      onready(editor);
    }

    if (editorEl.parentElement) {
      observer.observe(editorEl.parentElement);
    }
  });

  onDestroy(() => {
    monaco?.editor.getModels().forEach((model) => model.dispose());
    editor?.dispose();
  });
</script>

<div
  {...restProps}
  bind:this={editorEl}
  class={cn("h-full", restProps.class)}
></div>
