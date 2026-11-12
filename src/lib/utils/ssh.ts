export type SSHUsernameSource = "headscale" | "root" | "custom";

export interface SSHPreferences {
  enabled: boolean;
  source: SSHUsernameSource | undefined;
  customUsername: string;
  autoConnect: boolean;
}

export function sshPreferences(
  settings: Record<string, string | null> = {},
): SSHPreferences {
  const source = settings["ssh-username-source"] ?? "headscale";
  const validSource = source === "root" || source === "custom" ||
    source === "headscale";
  return {
    enabled: settings["ssh-default-username-enabled"] === "true",
    source: validSource ? source : undefined,
    customUsername: settings["ssh-custom-username"] ?? "",
    autoConnect: settings["ssh-auto-connect"] === "true",
  };
}

// Accept common Linux account names; do not silently rewrite an invalid name.
export function validSSHUsername(username: string): boolean {
  return username.length <= 64 &&
    /^[a-zA-Z_][a-zA-Z0-9_.-]*\$?$/.test(username);
}

export function defaultSSHUsername(
  preferences: SSHPreferences,
  loginName?: string,
): string | undefined {
  if (!preferences.enabled || !preferences.source) return;
  let candidate: string;
  switch (preferences.source) {
    case "root":
      candidate = "root";
      break;
    case "custom":
      candidate = preferences.customUsername;
      break;
    case "headscale":
      candidate = (loginName ?? "").split("@")[0];
      break;
  }
  const username = candidate.trim();
  return validSSHUsername(username) ? username : undefined;
}

export function validSSHHostname(hostname: string): boolean {
  return hostname.length > 0 && hostname.length <= 253 &&
    /^[a-zA-Z0-9_][a-zA-Z0-9_.:%-]*$/.test(hostname);
}
