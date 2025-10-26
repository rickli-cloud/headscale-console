import { writable } from "svelte/store";
import type { UserSettings } from "./settings";
import { errorToast } from "$lib/utils/error";

export interface AppConfig {
  logLevel: "OFF" | "ERROR" | "WARN" | "INFO" | "DEBUG" | "TRACE";
  /** Headscale url */
  controlUrl: string;
  /** Used to identify the self-service endpoint */
  selfserviceHostname: string | undefined;
  /** Used to identify the policy-service endpoint */
  policyserviceHostname: string | undefined;
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
    console.error("Failed to load config:", err);
    errorToast("Failed to load app config: " + err?.toString());
  } finally {
    const cfg: AppConfig = { ...configDefaults, ...data };
    appConfig.set(cfg);
    return cfg;
  }
}

const configDefaults: AppConfig = {
  logLevel: "INFO",
  controlUrl:
    import.meta.env.VITE_DEV_HEADSCALE_HOST ||
    window.ipnProfiles?.currentProfile?.ControlURL ||
    new URL("/", window.location.toString()).toString(),
  selfserviceHostname: undefined,
  policyserviceHostname: undefined,
  tags: [],
  defaults: {},
};
