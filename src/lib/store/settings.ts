import { writable } from "svelte/store";

const userSettingsStoragePrefix = "user-setting_";

export type UserSettings = {
  [key: string]: string | null;
};

/** Every setting needs to be defined here (used for syncing) */
export enum UserSettingKeys {}

const defaultUserSettings: UserSettings = {
  "open-connect-new-tab": null,
  "open-connect-popup": null,
};

export const userSettings = writable<UserSettings>();

userSettings.subscribe((settings) => {
  console.debug("userSettings:", settings);
  if (typeof settings !== "object") return;
  for (const key in settings) {
    if (settings[key] === null || settings[key] === "false") {
      localStorage.removeItem(userSettingsStoragePrefix + key);
    } else {
      localStorage.setItem(userSettingsStoragePrefix + key, settings[key]);
    }
  }
});

export function loadUserSettings(defaults: UserSettings) {
  const settings: UserSettings = {};
  for (const key of Object.values(UserSettingKeys)) {
    settings[key] =
      localStorage.getItem(userSettingsStoragePrefix + key) ??
      defaults[key] ??
      defaultUserSettings[key];
  }
  userSettings.set(settings);
}
