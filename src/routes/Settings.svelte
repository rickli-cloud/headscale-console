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
  const sshUsername = $derived(defaultSSHUsername(
    ssh, window.ipnProfiles?.currentProfile?.Config.UserProfile.LoginName,
  ));

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

    <div class="max-w-2xl space-y-6">
      <div class="flex items-center justify-between gap-6">
        <div class="space-y-1.5">
          <Label for="ssh-default-enabled">Use a default username</Label>
          <p class="text-sm text-muted-foreground">Prefill the Linux account used for SSH connections.</p>
        </div>
        <Switch id="ssh-default-enabled" checked={ssh.enabled}
          onCheckedChange={(value) => setSSHSetting(UserSettingKeys.SSHDefaultUsernameEnabled, String(value))} />
      </div>

      <RadioGroup.Root value={ssh.source} disabled={!ssh.enabled} aria-label="SSH username source"
        class="flex flex-wrap gap-6"
        onValueChange={(value) => setSSHSetting(UserSettingKeys.SSHUsernameSource, value)}>
        {#each [["headscale", "Headscale username"], ["root", "root"], ["custom", "Custom"]] as [value, label]}
          <div class="flex items-center gap-2">
            <RadioGroup.Item id={`ssh-source-${value}`} {value} />
            <Label for={`ssh-source-${value}`}>{label}</Label>
          </div>
        {/each}
      </RadioGroup.Root>

      {#if ssh.source === "headscale"}
        <p class="text-sm text-muted-foreground">Uses your current profile's login name, before @: alex@example.com → alex.</p>
      {:else if ssh.source === "root"}
        <p class="text-sm text-muted-foreground">Requests the root account. The server must explicitly allow it.</p>
      {:else}
        <div class="space-y-2">
          <Label for="ssh-custom-username">Custom username</Label>
          <Input id="ssh-custom-username" class="max-w-sm" value={ssh.customUsername} disabled={!ssh.enabled}
            autocomplete="off" spellcheck="false" maxlength={64}
            oninput={(event) => setSSHSetting(UserSettingKeys.SSHCustomUsername, event.currentTarget.value)} />
        </div>
      {/if}

      {#if ssh.enabled && !sshUsername}
        <p class="text-sm text-muted-foreground" role="status">No valid default username. Enter a Linux username when connecting, or choose another source.</p>
      {/if}

      <div class="flex items-center justify-between gap-6">
        <div class="space-y-1.5">
          <Label for="ssh-auto-connect">Connect automatically</Label>
          <p class="text-sm text-muted-foreground">Start SSH when a host and a valid default username are available.</p>
        </div>
        <Switch id="ssh-auto-connect" checked={ssh.autoConnect} disabled={!ssh.enabled}
          onCheckedChange={(value) => setSSHSetting(UserSettingKeys.SSHAutoConnect, String(value))} />
      </div>

      <p class="rounded-md bg-muted px-4 py-3 font-mono text-sm" aria-live="polite">
        {#if sshUsername}
          {sshUsername}@server → {ssh.autoConnect ? "connect automatically" : "confirm username"}
        {:else}
          server → enter username
        {/if}
      </p>
      <p class="text-sm text-muted-foreground">Preferences are saved in this browser and apply to new connections. SSH permissions still apply.</p>
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
