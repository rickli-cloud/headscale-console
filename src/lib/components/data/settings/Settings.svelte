<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import { get } from "svelte/store";

  import { Button } from "$lib/components/ui/button";
  import { Switch } from "$lib/components/ui/switch";
  import { Label } from "$lib/components/ui/label";

  import { UserSettingKeys, userSettings } from "$lib/store/settings";
  import { cn } from "$lib/utils/shadcn";
  import { onMount } from "svelte";

  interface Props extends HTMLAttributes<HTMLFormElement> {
    onsubmit?: () => void;
  }

  let { onsubmit, ...restProps }: Props = $props();

  let openConnectNewTab = $state<boolean>(false);
  let openConnectAsPopUp = $state<boolean>(false);

  function save() {
    userSettings.update((settings) => ({
      ...settings,
      [UserSettingKeys.openConnectNewTab]: String(openConnectNewTab),
      [UserSettingKeys.openConnectAsPopUp]: String(openConnectAsPopUp),
    }));
    onsubmit?.();
  }

  function reset() {
    const settings = get(userSettings);

    openConnectNewTab = settings[UserSettingKeys.openConnectNewTab] === "true";
    openConnectAsPopUp =
      settings[UserSettingKeys.openConnectAsPopUp] === "true";
  }

  onMount(() => {
    reset();
  });
</script>

<form {...restProps} class={cn("space-y-6", restProps.class)}>
  <div class="space-y-4">
    <div class="flex items-center space-x-2">
      <Switch id="openConnectNewTab" bind:checked={openConnectNewTab} />
      <Label for="openConnectNewTab">Open connections in new tab</Label>
    </div>

    <div class="flex items-center space-x-2">
      <Switch
        id="openConnectAsPopUp"
        disabled={!openConnectNewTab}
        bind:checked={openConnectAsPopUp}
      />
      <Label for="openConnectAsPopUp">Open connections as pop-up</Label>
    </div>
  </div>

  <div class="flex gap-1.5 items-center justify-end">
    <Button
      type="submit"
      onclick={(ev) => {
        ev.preventDefault();
        save();
      }}
    >
      Save
    </Button>
  </div>
</form>
