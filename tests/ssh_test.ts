import { deepStrictEqual, equal } from "node:assert/strict";
import {
  defaultSSHUsername,
  sshPreferences,
  validSSHHostname,
  validSSHUsername,
} from "../src/lib/utils/ssh.ts";

Deno.test("defaults keep SSH username selection and auto-connect opt-in", () => {
  deepStrictEqual(sshPreferences(), {
    enabled: false,
    source: "headscale",
    customUsername: "",
    autoConnect: false,
  });
  equal(defaultSSHUsername(sshPreferences(), "alex"), undefined);
});

Deno.test("resolve the current profile login, root and a trimmed custom username", () => {
  const preferences = {
    enabled: true,
    autoConnect: true,
    customUsername: " deploy ",
    source: "headscale" as const,
  };
  equal(defaultSSHUsername(preferences, "alex@example.com"), "alex");
  equal(defaultSSHUsername(preferences, "alex@"), "alex");
  equal(defaultSSHUsername({ ...preferences, source: "root" }), "root");
  equal(defaultSSHUsername({ ...preferences, source: "custom" }), "deploy");
  equal(
    defaultSSHUsername({ ...preferences, enabled: false }, "alex"),
    undefined,
  );
});

Deno.test("missing and invalid defaults require manual entry without another account fallback", () => {
  const preferences = sshPreferences({
    "ssh-default-username-enabled": "true",
    "ssh-auto-connect": "true",
  });
  for (
    const login of [
      undefined,
      "",
      "@example.com",
      "Alex Smith",
      "https://id.example/alex",
      "-root",
      "alex\u001b[31m",
    ]
  ) {
    equal(defaultSSHUsername(preferences, login), undefined);
  }
  equal(
    defaultSSHUsername(
      { ...preferences, source: "custom", customUsername: "" },
      "alex",
    ),
    undefined,
  );
  equal(
    defaultSSHUsername(
      sshPreferences({
        "ssh-default-username-enabled": "true",
        "ssh-username-source": "unknown",
      }),
      "alex",
    ),
    undefined,
  );
});

Deno.test("username and host validation reject terminal controls and ambiguous targets", () => {
  for (
    const name of [
      "root",
      "alex",
      "_service",
      "Alex.Smith",
      "build-agent",
      "machine$",
    ]
  ) equal(validSSHUsername(name), true);
  for (const name of ["", "a b", "-root", "a\nroot", "a@b", "a".repeat(65)]) {
    equal(validSSHUsername(name), false);
  }
  for (
    const host of [
      "server",
      "server.example.com",
      "100.64.0.1",
      "fd7a:115c:a1e0::1",
    ]
  ) equal(validSSHHostname(host), true);
  for (
    const host of [
      "",
      "alex@server",
      "server/path",
      "server\r\n",
      "\u001b[31mserver",
      "a".repeat(254),
    ]
  ) equal(validSSHHostname(host), false);
});

Deno.test("explicit false preferences survive reload and override enabled deployment defaults", async () => {
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    },
  });
  const { get } = await import("svelte/store");
  const { userSettings, loadUserSettings, UserSettingKeys } = await import(
    "../src/lib/store/settings.ts"
  );
  const defaults = {
    [UserSettingKeys.SSHDefaultUsernameEnabled]: "true",
    [UserSettingKeys.SSHAutoConnect]: "true",
  };
  loadUserSettings(defaults);
  equal(sshPreferences(get(userSettings)).autoConnect, true);
  userSettings.update((settings) => ({
    ...settings,
    [UserSettingKeys.SSHAutoConnect]: "false",
  }));
  loadUserSettings(defaults);
  equal(sshPreferences(get(userSettings)).autoConnect, false);
  equal(values.get("user-setting_ssh-auto-connect"), "false");
});
