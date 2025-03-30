import { defineConfig, Plugin } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { resolve } from "node:path";
import { readFileSync } from "node:fs";

const pkg: typeof import("./package.json") = JSON.parse(
  new TextDecoder().decode(readFileSync(resolve(__dirname, "package.json")))
);

// https://vite.dev/config/
export default defineConfig({
  base: "",
  plugins: [versionVirtualModulePlugin(), svelte()],
  resolve: {
    alias: {
      $lib: resolve(__dirname, "src/lib"),
    },
  },
});

// Pass app version thru a virtual module
// Type definitions in src/vite-env.d.ts
const versionVirtualModuleId = "virtual:app-version";
function versionVirtualModulePlugin(): Plugin {
  return {
    name: "version-virtual-module-plugin",
    resolveId(id) {
      if (id === versionVirtualModuleId) {
        return "\0" + versionVirtualModuleId;
      }
    },
    load(id) {
      if (id === "\0" + versionVirtualModuleId) {
        return `export default "${pkg.version}"`;
      }
    },
  };
}
