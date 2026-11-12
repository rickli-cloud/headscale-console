<script lang="ts">
  import {
    systemPrefersMode,
    userPrefersMode,
    setMode,
    resetMode,
  } from "mode-watcher";

  import appVersion from "virtual:app-version";

  import { Label } from "$lib/components/ui/label";
  import { Switch } from "$lib/components/ui/switch";
  import { Input } from "$lib/components/ui/input";
  import * as RadioGroup from "$lib/components/ui/radio-group";

  import { appConfig } from "$lib/store/config";
  import { userSettings, UserSettingKeys } from "$lib/store/settings";
  import { defaultSSHUsername, sshPreferences } from "$lib/utils/ssh";

  import Layout from "../Layout.svelte";

  let theme = $state<"dark" | "light" | "system">($userPrefersMode);
  const ssh = $derived(sshPreferences($userSettings));
  let customUsernameTouched = $state(false);
  const usernameMode = $derived(ssh.enabled ? ssh.source ?? "ask" : "ask");
  const profileUsername = $derived(defaultSSHUsername(
    { ...ssh, enabled: true, source: "headscale" },
    window.ipnProfiles?.currentProfile?.Config.UserProfile.LoginName,
  ));
  const sshUsername = $derived(defaultSSHUsername(
    ssh, window.ipnProfiles?.currentProfile?.Config.UserProfile.LoginName,
  ));

  function setUsernameMode(mode: string) {
    customUsernameTouched = false;
    userSettings.update((settings) => ({
      ...settings,
      [UserSettingKeys.SSHDefaultUsernameEnabled]: String(mode !== "ask"),
      [UserSettingKeys.SSHUsernameSource]: mode === "ask" ? ssh.source ?? "headscale" : mode,
      ...(mode === "ask" ? { [UserSettingKeys.SSHAutoConnect]: "false" } : {}),
    }));
  }

  function setSSHSetting(key: UserSettingKeys, value: string) {
    userSettings.update((settings) => ({ ...settings, [key]: value }));
  }

  $effect(() => {
    if (theme === "system") resetMode();
    else setMode(theme);
  });
</script>

<Layout>
  <section class="space-y-1.5">
    <h3 class="scroll-m-20 text-2xl font-semibold tracking-tight">Settings</h3>
    <p class="text-muted-foreground">Manage your preferences</p>
  </section>

  <section class="space-y-4">
    <h2
      class="scroll-m-20 border-b pb-2 text-xl font-semibold tracking-tight transition-colors first:mt-0"
    >
      Theme
    </h2>

    <RadioGroup.Root
      class="grid max-w-2xl sm:grid-cols-3 gap-8 pt-2"
      orientation="horizontal"
      bind:value={theme}
    >
      <Label class="[&:has([data-state=checked])>div]:border-primary">
        <RadioGroup.Item value="system" class="sr-only" />
        {#if $systemPrefersMode === "light" || !$systemPrefersMode}
          <div
            class="items-center rounded-md border-2 border-muted p-1 hover:border-accent"
          >
            <div class="space-y-2 rounded-sm bg-[#ecedef] p-2">
              <div class="space-y-2 rounded-md bg-white p-2 shadow-sm">
                <div class="h-2 w-[80px] rounded-lg bg-[#ecedef]"></div>
                <div class="h-2 w-[100px] rounded-lg bg-[#ecedef]"></div>
              </div>
              <div
                class="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm"
              >
                <div class="h-4 w-4 rounded-full bg-[#ecedef]"></div>
                <div class="h-2 w-[100px] rounded-lg bg-[#ecedef]"></div>
              </div>
              <div
                class="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm"
              >
                <div class="h-4 w-4 rounded-full bg-[#ecedef]"></div>
                <div class="h-2 w-[100px] rounded-lg bg-[#ecedef]"></div>
              </div>
            </div>
          </div>
        {:else}
          <div
            class="items-center rounded-md border-2 border-muted bg-popover p-1 hover:bg-accent hover:text-accent-foreground"
          >
            <div class="space-y-2 rounded-sm bg-slate-950 p-2">
              <div class="space-y-2 rounded-md bg-slate-800 p-2 shadow-sm">
                <div class="h-2 w-[80px] rounded-lg bg-slate-400"></div>
                <div class="h-2 w-[100px] rounded-lg bg-slate-400"></div>
              </div>
              <div
                class="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm"
              >
                <div class="h-4 w-4 rounded-full bg-slate-400"></div>
                <div class="h-2 w-[100px] rounded-lg bg-slate-400"></div>
              </div>
              <div
                class="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm"
              >
                <div class="h-4 w-4 rounded-full bg-slate-400"></div>
                <div class="h-2 w-[100px] rounded-lg bg-slate-400"></div>
              </div>
            </div>
          </div>
        {/if}
        <span class="block w-full p-2 text-center font-normal"> System </span>
      </Label>

      <Label class="[&:has([data-state=checked])>div]:border-primary">
        <RadioGroup.Item value="light" class="sr-only" />
        <div
          class="items-center rounded-md border-2 border-muted p-1 hover:border-accent"
        >
          <div class="space-y-2 rounded-sm bg-[#ecedef] p-2">
            <div class="space-y-2 rounded-md bg-white p-2 shadow-sm">
              <div class="h-2 w-[80px] rounded-lg bg-[#ecedef]"></div>
              <div class="h-2 w-[100px] rounded-lg bg-[#ecedef]"></div>
            </div>
            <div
              class="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm"
            >
              <div class="h-4 w-4 rounded-full bg-[#ecedef]"></div>
              <div class="h-2 w-[100px] rounded-lg bg-[#ecedef]"></div>
            </div>
            <div
              class="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm"
            >
              <div class="h-4 w-4 rounded-full bg-[#ecedef]"></div>
              <div class="h-2 w-[100px] rounded-lg bg-[#ecedef]"></div>
            </div>
          </div>
        </div>
        <span class="block w-full p-2 text-center font-normal"> Light </span>
      </Label>

      <Label class="[&:has([data-state=checked])>div]:border-primary">
        <RadioGroup.Item value="dark" class="sr-only" />
        <div
          class="items-center rounded-md border-2 border-muted bg-popover p-1 hover:bg-accent hover:text-accent-foreground"
        >
          <div class="space-y-2 rounded-sm bg-slate-950 p-2">
            <div class="space-y-2 rounded-md bg-slate-800 p-2 shadow-sm">
              <div class="h-2 w-[80px] rounded-lg bg-slate-400"></div>
              <div class="h-2 w-[100px] rounded-lg bg-slate-400"></div>
            </div>
            <div
              class="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm"
            >
              <div class="h-4 w-4 rounded-full bg-slate-400"></div>
              <div class="h-2 w-[100px] rounded-lg bg-slate-400"></div>
            </div>
            <div
              class="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm"
            >
              <div class="h-4 w-4 rounded-full bg-slate-400"></div>
              <div class="h-2 w-[100px] rounded-lg bg-slate-400"></div>
            </div>
          </div>
        </div>
        <span class="block w-full p-2 text-center font-normal"> Dark </span>
      </Label>
    </RadioGroup.Root>
  </section>

  <section class="space-y-4">
    <h2
      class="scroll-m-20 border-b pb-2 text-xl font-semibold tracking-tight transition-colors first:mt-0"
    >
      SSH
    </h2>

    <div class="max-w-2xl space-y-5">
      <div class="grid items-center gap-3 sm:grid-cols-[1fr_20rem]">
        <Label for="ssh-username-mode">Username</Label>
        <select
          id="ssh-username-mode"
          value={usernameMode}
          onchange={(event) => setUsernameMode(event.currentTarget.value)}
          aria-describedby={usernameMode === "headscale" && !profileUsername ? "ssh-profile-error" : undefined}
          class="border-input bg-background text-foreground focus-visible:ring-ring h-9 w-full min-w-0 rounded-md border px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1"
        >
          <option value="ask">Ask every time</option>
          <option value="headscale">Headscale username{profileUsername ? ` (${profileUsername})` : ""}</option>
          <option value="root">root</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      {#if usernameMode === "custom"}
        {@const invalidUsername = !sshUsername && (customUsernameTouched || ssh.customUsername.length > 0)}
        <div class="grid items-start gap-3 sm:grid-cols-[1fr_20rem]">
          <Label for="ssh-custom-username" class="sm:pt-2.5">Custom username</Label>
          <div class="space-y-2">
            <Input
              id="ssh-custom-username"
              value={ssh.customUsername}
              autocomplete="off"
              spellcheck="false"
              maxlength={64}
              aria-invalid={invalidUsername}
              aria-describedby={invalidUsername ? "ssh-username-error" : undefined}
              onblur={() => customUsernameTouched = true}
              oninput={(event) => setSSHSetting(UserSettingKeys.SSHCustomUsername, event.currentTarget.value)}
            />
            {#if invalidUsername}
              <p id="ssh-username-error" class="text-sm text-destructive" role="status">Enter a valid Linux username.</p>
            {/if}
          </div>
        </div>
      {:else if usernameMode === "headscale" && !profileUsername}
        <p id="ssh-profile-error" class="text-sm text-muted-foreground" role="status">No usable username in this profile.</p>
      {/if}

      <div class="flex items-center justify-between gap-6 border-t pt-5">
        <Label for="ssh-auto-connect">Connect automatically</Label>
        <Switch
          id="ssh-auto-connect"
          checked={Boolean(sshUsername) && ssh.autoConnect}
          disabled={!sshUsername}
          onCheckedChange={(value) => setSSHSetting(UserSettingKeys.SSHAutoConnect, String(value))}
        />
      </div>
    </div>
  </section>

  <section class="space-y-4">
    <h2 class="scroll-m-20 border-b pb-2 text-xl font-semibold tracking-tight transition-colors first:mt-0">About</h2>

    <div>
      <table class="basic-table">
        <tbody>
          <tr>
            <th>Version</th>
            <td>{appVersion}</td>
          </tr>

          <tr>
            <th>Service Worker</th>
            <td>
              {#await navigator.serviceWorker.getRegistration() then registration}
                {registration ? "Registered" : "Not registered"}
              {/await}
            </td>
          </tr>

          <tr>
            <th>Control Server</th>
            <td>{$appConfig.controlUrl}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</Layout>
