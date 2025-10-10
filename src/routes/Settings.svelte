<script lang="ts">
  import {
    systemPrefersMode,
    userPrefersMode,
    setMode,
    resetMode,
  } from "mode-watcher";

  import appVersion from "virtual:app-version";

  import { Label } from "$lib/components/ui/label";
  import * as RadioGroup from "$lib/components/ui/radio-group";

  import { appConfig } from "$lib/store/config";

  import Layout from "../Layout.svelte";

  let theme = $state<"dark" | "light" | "system">($userPrefersMode);

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
      About
    </h2>

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
