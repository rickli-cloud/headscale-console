import { writable } from "svelte/store";
import type { UserSettings } from "./settings";

export interface AppConfig {
  logLevel: "OFF" | "ERROR" | "WARN" | "INFO" | "DEBUG" | "TRACE";
  /** Headscale url */
  controlUrl: string;
  /** Used to identify the self-service endpoint */
  selfserviceHostname: string;
  /** Only apply when using a authkey */
  tags: string[];
  /** User settings defaults. See `./settings` */
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
    logLevel: "INFO",
    controlUrl:
      import.meta.env.VITE_DEV_HEADSCALE_HOST ||
      (window.ipnProfiles.current &&
        window.ipnProfiles.profiles[window.ipnProfiles.current]?.ControlURL) ||
      new URL("/", window.location.toString()).toString(),
    selfserviceHostname: "self-service",
    tags: [],
    defaults: {},
    ...opt,
  };
}
