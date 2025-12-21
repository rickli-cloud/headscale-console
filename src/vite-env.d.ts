/// <reference types="svelte" />
/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module "virtual:app-version" {
  const version: string;
  export default version;
}
