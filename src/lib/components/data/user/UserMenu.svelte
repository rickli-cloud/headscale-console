<script lang="ts">
  import LogOut from "@lucide/svelte/icons/log-out";
  import Users from "@lucide/svelte/icons/users";

  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
  import * as Avatar from "$lib/components/ui/avatar";
  import { shortName } from "$lib/utils/misc";

  import LogoutDialog from "./logout-dialog.svelte";

  let logoutDialog: LogoutDialog;
</script>

<LogoutDialog bind:this={logoutDialog} />

<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    {#snippet child({ props })}
      <button {...props} class="md:h-8 md:p-0">
        <Avatar.Root class="h-8 w-8 rounded-lg">
          <!-- <Avatar.Image src={ user.avatar} alt={user.name} /> -->
          <Avatar.Fallback class="rounded-lg border">
            {shortName(
              window.ipnProfiles?.currentProfile?.Config.UserProfile
                .DisplayName ||
                window.ipnProfiles?.currentProfile?.Config.UserProfile
                  .LoginName ||
                String(
                  window.ipnProfiles?.currentProfile?.Config.UserProfile.ID
                )
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
              window.ipnProfiles?.currentProfile?.Config.UserProfile
                .DisplayName ||
                window.ipnProfiles?.currentProfile?.Config.UserProfile
                  .LoginName ||
                window.ipnProfiles?.currentProfile?.Config.UserProfile.ID
            )}
          </Avatar.Fallback>
        </Avatar.Root>
        <div class="grid flex-1 text-left text-sm leading-tight">
          <span class="truncate font-semibold">
            {window.ipnProfiles?.currentProfile?.Config.UserProfile.DisplayName}
          </span>
          <span class="truncate text-xs">
            {window.ipnProfiles?.currentProfile?.Config.UserProfile.LoginName}
          </span>
        </div>
      </div>
    </DropdownMenu.Label>

    <DropdownMenu.Separator />

    <DropdownMenu.Group>
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
