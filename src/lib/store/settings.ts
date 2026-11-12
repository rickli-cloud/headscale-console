import { writable } from "svelte/store";

const userSettingsStoragePrefix = "user-setting_";

export type UserSettings = {
  [key: string]: string | null;
};

/** Every setting needs to be defined here (used for syncing) */
export enum UserSettingKeys {
  SSHDefaultUsernameEnabled = "ssh-default-username-enabled",
  SSHUsernameSource = "ssh-username-source",
  SSHCustomUsername = "ssh-custom-username",
  SSHAutoConnect = "ssh-auto-connect",
}

const defaultUserSettings: UserSettings = {
  "open-connect-new-tab": null,
  "open-connect-popup": null,
  [UserSettingKeys.SSHDefaultUsernameEnabled]: "false",
  [UserSettingKeys.SSHUsernameSource]: "headscale",
  [UserSettingKeys.SSHCustomUsername]: "",
  [UserSettingKeys.SSHAutoConnect]: "false",
};

export const userSettings = writable<UserSettings>();

userSettings.subscribe((settings) => {
  console.debug("userSettings:", settings);
  if (typeof settings !== "object") return;
  for (const key in settings) {
    if (settings[key] === null) {
      localStorage.removeItem(userSettingsStoragePrefix + key);
    } else {
      localStorage.setItem(userSettingsStoragePrefix + key, settings[key]);
    }
  }
});

export function loadUserSettings(defaults: UserSettings) {
  const settings: UserSettings = {};
  for (const key of Object.values(UserSettingKeys)) {
    settings[key] = localStorage.getItem(userSettingsStoragePrefix + key) ??
      defaults[key] ??
      defaultUserSettings[key];
  }
  userSettings.set(settings);
}
