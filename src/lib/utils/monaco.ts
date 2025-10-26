import type * as monaco from "monaco-editor";

export const monacoThemes: {
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
