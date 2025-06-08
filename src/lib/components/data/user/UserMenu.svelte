<script lang="ts">
  import { get } from "svelte/store";

  import TriangleAlert from "lucide-svelte/icons/triangle-alert";
  import KeyRound from "lucide-svelte/icons/key-round";
  import LogOut from "lucide-svelte/icons/log-out";
  import Users from "lucide-svelte/icons/users";
  import Plus from "lucide-svelte/icons/plus";
  import Cog from "lucide-svelte/icons/cog";

  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
  import * as Avatar from "$lib/components/ui/avatar";
  import { Button } from "$lib/components/ui/button";
  import * as Sheet from "$lib/components/ui/sheet";
  import * as Alert from "$lib/components/ui/alert/index.js";

  import CreateAuthkey from "$lib/components/data/authkeys/CreateAuthkey.svelte";
  import Settings from "$lib/components/data/settings/Settings.svelte";
  import AuthKey from "$lib/components/data/authkeys/AuthKey.svelte";

  import Spinner from "$lib/components/utils/Spinner.svelte";

  import { selfserviceCap, selfserviceHostname } from "$lib/store/selfservice";
  import { SelfService, type Preauthkey } from "$lib/api/self-service";
  import { shortName } from "$lib/utils/misc";

  import LogoutDialog from "./logout-dialog.svelte";

  let logoutDialog: LogoutDialog;

  let settingsSheetOpen = $state<boolean>(false);

  let authkeysSheetOpen = $state<boolean>(false);
  let authkeysLoadPromise = $state<Promise<Preauthkey[]>>(Promise.resolve([]));
  let createAuthkeySheetOpen = $state<boolean>(false);

  async function loadAuthkeys() {
    if (get(selfserviceHostname)?.length) {
      authkeysLoadPromise = SelfService.getAuthkeys();
    }
  }
</script>

<LogoutDialog bind:this={logoutDialog} />

<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    {#snippet child({ props })}
      <button {...props} class="md:h-8 md:p-0">
        <Avatar.Root class="h-8 w-8 rounded-lg">
          <!-- <Avatar.Image src={ user.avatar} alt={user.name} /> -->
          <Avatar.Fallback class="rounded-lg">
            {shortName(
              window.ipnProfiles.currentProfile?.Config.UserProfile
                .DisplayName ||
                window.ipnProfiles.currentProfile?.Config.UserProfile
                  .LoginName ||
                String(window.ipnProfiles.currentProfile?.Config.UserProfile.ID)
            )}
          </Avatar.Fallback>
        </Avatar.Root>
      </button>
    {/snippet}
  </DropdownMenu.Trigger>

  <DropdownMenu.Content
    class="w-[--bits-dropdown-menu-anchor-width] min-w-56 rounded-lg"
    side="bottom"
    align="end"
    sideOffset={4}
  >
    <DropdownMenu.Label class="p-0 font-normal">
      <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
        <Avatar.Root class="h-8 w-8 rounded-lg">
          <!-- <Avatar.Image src={user.avatar} alt={user.name} /> -->
          <Avatar.Fallback class="rounded-lg">
            {shortName(
              window.ipnProfiles.currentProfile?.Config.UserProfile
                .DisplayName ||
                window.ipnProfiles.currentProfile?.Config.UserProfile
                  .LoginName ||
                window.ipnProfiles.currentProfile?.Config.UserProfile.ID
            )}
          </Avatar.Fallback>
        </Avatar.Root>
        <div class="grid flex-1 text-left text-sm leading-tight">
          <span class="truncate font-semibold">
            {window.ipnProfiles.currentProfile?.Config.UserProfile.DisplayName}
          </span>
          <span class="truncate text-xs">
            {window.ipnProfiles.currentProfile?.Config.UserProfile.LoginName}
          </span>
        </div>
      </div>
    </DropdownMenu.Label>

    <DropdownMenu.Separator />

    <DropdownMenu.Group>
      <DropdownMenu.Item
        class="cursor-pointer"
        onclick={() => (settingsSheetOpen = true)}
      >
        <Cog />
        Settings
      </DropdownMenu.Item>

      <DropdownMenu.Item
        onclick={() => {
          loadAuthkeys();
          authkeysSheetOpen = true;
        }}
        class="cursor-pointer"
      >
        <KeyRound />
        Authkeys
      </DropdownMenu.Item>

      <DropdownMenu.Item class="cursor-pointer" onclick={() => {}} disabled>
        <Users />
        Switch User
      </DropdownMenu.Item>

      <DropdownMenu.Item
        class="cursor-pointer"
        onclick={() => {
          logoutDialog.open();
        }}
      >
        <LogOut />
        Log out
      </DropdownMenu.Item>
    </DropdownMenu.Group>
  </DropdownMenu.Content>
</DropdownMenu.Root>

<Sheet.Root bind:open={settingsSheetOpen}>
  <Sheet.Content>
    <Sheet.Header>
      <Sheet.Title>Settings</Sheet.Title>
      <Sheet.Description>
        Configure the core features and behavior of the application to match
        your workflow. Follow the documentation for advanced configuration
        options.
      </Sheet.Description>
    </Sheet.Header>

    <br />

    <Settings onsubmit={() => (settingsSheetOpen = false)} />
  </Sheet.Content>
</Sheet.Root>

<Sheet.Root bind:open={authkeysSheetOpen}>
  <Sheet.Content>
    <Sheet.Header>
      <Sheet.Title>Authkeys</Sheet.Title>
      <Sheet.Description>
        Authkeys let a device bypass the usual login procedure and establish a
        session that never expires unless it's explicitly revoked.
      </Sheet.Description>
    </Sheet.Header>

    {#if typeof $selfserviceCap === "undefined"}
      <Alert.Root variant="destructive" class="my-6">
        <TriangleAlert class="size-4" />
        <Alert.Title>Self Service Unavailable</Alert.Title>
        <Alert.Description>Could not find self service API</Alert.Description>
      </Alert.Root>
    {:else}
      <div class="space-y-2 empty:hidden my-6">
        {#if $selfserviceCap.authkeys}
          <Sheet.Root bind:open={createAuthkeySheetOpen}>
            <Sheet.Trigger>
              {#snippet child({ props })}
                <Button {...props} variant="ghost" class="justify-start w-full">
                  <Plus class="h-4 w-4" />
                  <span>Create</span>
                </Button>
              {/snippet}
            </Sheet.Trigger>

            <Sheet.Content side="left" class="space-y-6">
              <Sheet.Header>
                <Sheet.Title>Create Authkey</Sheet.Title>
                <Sheet.Description>
                  Machines using this key will be automatically linked to your
                  user account.
                </Sheet.Description>
              </Sheet.Header>

              <CreateAuthkey
                onupdate={() => loadAuthkeys()}
                onsubmit={() => (createAuthkeySheetOpen = false)}
              />
            </Sheet.Content>
          </Sheet.Root>
        {:else}
          <Alert.Root variant="warning" class="my-6">
            <TriangleAlert class="size-4" />
            <Alert.Title>Authkey Creation Restricted</Alert.Title>
            <Alert.Description>
              Authkey creation via self-service is currently restricted. Please
              contact your administrator or try using the CLI if applicable.
            </Alert.Description>
          </Alert.Root>
        {/if}
      </div>

      {#await authkeysLoadPromise}
        <div class="w-full h-32 grid place-items-center">
          <Spinner class="h-10 w-10" />
        </div>
      {:then authkeys}
        <div class="w-full [&>div]:border-b [&>div:last-child]:border-b-0">
          {#if authkeys?.length}
            {#each authkeys?.reverse() || [] as authkey}
              <AuthKey {authkey} onupdate={() => loadAuthkeys()} />
            {/each}
          {:else}
            <div class="w-full grid place-items-center h-12">
              <p class="text-xs text-muted-foreground">
                No owned Authkeys found.
              </p>
            </div>
          {/if}
        </div>
      {/await}
    {/if}
  </Sheet.Content>
</Sheet.Root>
