/// <reference types="svelte" />
/// <reference types="vite/client" />

declare module "virtual:app-version" {
  const version: string;
  export default version;
}

declare module "virtual:ipn-version" {
  const version: string;
  export default version;
}
