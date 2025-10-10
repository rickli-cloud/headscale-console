import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig, Plugin } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { config } from "dotenv";

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

config();
const {
  /** @see https://vite.dev/guide/build#relative-base */
  BASE_PATH = "./",
  DISABLE_PWA = "false",
} = process.env;

const pkg: typeof import("./package.json") = JSON.parse(
  new TextDecoder().decode(readFileSync(resolve(__dirname, "package.json")))
);

// Virtual modules to provide configuration
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
        return `export default "${pkg.version.replace(/^0\.0\.0-/, "")}"`;
      }
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({}) => {
  return {
    base: BASE_PATH,
    plugins: [
      versionVirtualModulePlugin(),
      svelte(),
      VitePWA({
        disable: DISABLE_PWA === "true",
        registerType: "autoUpdate",
        workbox: {
          maximumFileSizeToCacheInBytes: 100 * 1024 * 1024, // 100 MiB
        },
      }) as Plugin[],
    ],
    resolve: {
      alias: {
        $lib: resolve(__dirname, "src/lib"),
        $pkg: resolve(__dirname, "wasm/pkg"),
        $routes: resolve(__dirname, "src/routes"),
      },
    },
    server: {},
  };
});
