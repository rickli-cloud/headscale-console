import { writable } from "svelte/store";
import type { UserSettings } from "./settings";

export interface AppConfig {
  controlUrl: string;
  selfserviceHostname: string;
  tags: string[];
  defaults: UserSettings;
}

export const appConfig = writable<AppConfig>();

appConfig.subscribe((cfg) => console.debug("AppConfig:", cfg));

export async function loadAppConfig(): Promise<AppConfig> {
  let data: Partial<AppConfig> = {};
  try {
    const res = await fetch("./config.json");
    if (
      res.status === 200 &&
      res.headers.get("content-type") === "application/json"
    ) {
      data = await res.json();
    }
  } catch (err) {
    console.error("failed to load config", err);
  } finally {
    const cfg = applyDefaults(data);
    appConfig.set(cfg);
    return cfg;
  }
}

function applyDefaults(opt: Partial<AppConfig>): AppConfig {
  return {
    controlUrl:
      import.meta.env.VITE_DEV_HEADSCALE_HOST ||
      window.ipnProfile?.ControlURL ||
      new URL("/", window.location.toString()).toString(),
    selfserviceHostname: "self-service",
    tags: [],
    defaults: {},
    ...opt,
  };
}
