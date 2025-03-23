<script lang="ts">
  import ChevronsUpDown from "lucide-svelte/icons/chevrons-up-down";
  import LogOut from "lucide-svelte/icons/log-out";

  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
  import * as Sidebar from "$lib/components/ui/sidebar";
  import * as Avatar from "$lib/components/ui/avatar";
  import { useSidebar } from "$lib/components/ui/sidebar";

  import LogoutDialog from "./logout-dialog.svelte";

  const sidebar = useSidebar();

  function shortName(name: string | number | undefined) {
    if (typeof name !== "number" && !name?.length) return "?";
    const split = String(name).split(/\s+/g);
    if (split.length === 2) return `${split[0][0]}${split[1][0]}`.toUpperCase();
    return String(name).slice(0, 2).toUpperCase();
  }

  let logoutDialog: LogoutDialog;
</script>

<Sidebar.Menu>
  <Sidebar.MenuItem>
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        {#snippet child({ props })}
          <Sidebar.MenuButton
            {...props}
            size="lg"
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground md:h-8 md:p-0"
          >
            <Avatar.Root class="h-8 w-8 rounded-lg">
              <!-- <Avatar.Image src={ user.avatar} alt={user.name} /> -->
              <Avatar.Fallback class="rounded-lg"
                >{shortName(
                  window.tailscaleProfile?.Config.UserProfile.DisplayName ||
                    window.tailscaleProfile?.Config.UserProfile.LoginName ||
                    String(window.tailscaleProfile?.Config.UserProfile.ID)
                )}</Avatar.Fallback
              >
            </Avatar.Root>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-semibold"
                >{window.tailscaleProfile?.Config.UserProfile.DisplayName}</span
              >
              <span class="truncate text-xs"
                >{window.tailscaleProfile?.Config.UserProfile.LoginName}</span
              >
            </div>
            <ChevronsUpDown class="ml-auto size-4" />
          </Sidebar.MenuButton>
        {/snippet}
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        class="w-[--bits-dropdown-menu-anchor-width] min-w-56 rounded-lg"
        side={sidebar.isMobile ? "bottom" : "right"}
        align="end"
        sideOffset={4}
      >
        <DropdownMenu.Label class="p-0 font-normal">
          <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar.Root class="h-8 w-8 rounded-lg">
              <!-- <Avatar.Image src={user.avatar} alt={user.name} /> -->
              <Avatar.Fallback class="rounded-lg"
                >{shortName(
                  window.tailscaleProfile?.Config.UserProfile.DisplayName ||
                    window.tailscaleProfile?.Config.UserProfile.LoginName ||
                    window.tailscaleProfile?.Config.UserProfile.ID
                )}</Avatar.Fallback
              >
            </Avatar.Root>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-semibold"
                >{window.tailscaleProfile?.Config.UserProfile.DisplayName}</span
              >
              <span class="truncate text-xs"
                >{window.tailscaleProfile?.Config.UserProfile.LoginName}</span
              >
            </div>
          </div>
        </DropdownMenu.Label>

        <DropdownMenu.Separator />

        <DropdownMenu.Item
          onclick={() => logoutDialog.open()}
          class="cursor-pointer"
        >
          <LogOut />
          Log out
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  </Sidebar.MenuItem>
</Sidebar.Menu>

<LogoutDialog bind:this={logoutDialog} />
