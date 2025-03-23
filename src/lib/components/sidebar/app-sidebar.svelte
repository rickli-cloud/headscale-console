<script lang="ts">
  import { type ComponentProps } from "svelte";

  import PanelLeft from "lucide-svelte/icons/panel-left";
  import Server from "lucide-svelte/icons/server";
  import Cog from "lucide-svelte/icons/cog";

  import * as Sidebar from "$lib/components/ui/sidebar";
  import { useSidebar } from "$lib/components/ui/sidebar";

  import NavUser from "./nav-user.svelte";
  import { cn } from "$lib/utils/shadcn";
  import { IpnEvents, NotifyNetMapEvent } from "$lib/utils/tailscale";
  import type { Tailscale } from "$lib/types/tailscale.d";
  import Badge from "../ui/badge/badge.svelte";
  import Terminal from "lucide-svelte/icons/terminal";

  interface Props extends ComponentProps<typeof Sidebar.Root> {}

  let { ref = $bindable(null), ...restProps }: Props = $props();

  let activeItem = $state<"nodes" | "sessions" | "settings">("nodes");
  let netMap = $state<Tailscale.NetMap | undefined>();

  const sidebar = useSidebar();

  window.ipnEventHandler.addEventListener(IpnEvents.netMap, (ev) => {
    if (!(ev instanceof NotifyNetMapEvent)) {
      throw new Error(
        `Event payload for ${IpnEvents.netMap} is not instance of NotifyNetMapEvent`
      );
    }

    if (!ev.netMapStr) return;

    netMap = JSON.parse(ev.netMapStr);
  });

  /** Get peers with taiscale ssh enabled first */
  function sortPeers(peers: Tailscale.Peer[] | undefined): Tailscale.Peer[] {
    if (!peers) return [];
    return [
      ...peers.filter((peer) => peer.tailscaleSSHEnabled),
      ...peers.filter((peer) => !peer.tailscaleSSHEnabled),
    ];
  }
</script>

<Sidebar.Root
  bind:ref
  collapsible="icon"
  side="right"
  {...restProps}
  class={cn(
    "overflow-hidden [&>[data-sidebar=sidebar]]:flex-row-reverse",
    restProps.class
  )}
>
  <Sidebar.Root
    collapsible="none"
    class="!w-[calc(var(--sidebar-width-icon)_+_1px)] border-l hidden md:flex"
    side="right"
  >
    <div class="h-2.5 md:h-0.5"></div>

    <Sidebar.Header>
      <Sidebar.Menu>
        <Sidebar.MenuItem>
          <Sidebar.MenuButton
            size="lg"
            class="md:h-8 md:p-0"
            onclick={() => {
              sidebar.toggle();
            }}
          >
            {#snippet child({ props })}
              <a href="##" {...props}>
                <div
                  class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
                >
                  <PanelLeft class="size-4" />
                </div>
                <div class="grid flex-1 text-left text-sm leading-tight">
                  <span class="truncate font-semibold">Servers</span>
                  <span class="truncate text-xs"></span>
                </div>
              </a>
            {/snippet}
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>
      </Sidebar.Menu>
    </Sidebar.Header>

    <Sidebar.Content>
      <Sidebar.Group class="py-1">
        <Sidebar.GroupContent class="px-1.5 md:px-0">
          <Sidebar.Menu class="gap-1.5">
            <Sidebar.MenuItem>
              <Sidebar.MenuButton
                tooltipContentProps={{
                  hidden: false,
                }}
                onclick={() => {
                  if (activeItem === "nodes") sidebar.toggle();
                  else {
                    activeItem = "nodes";
                    sidebar.setOpen(true);
                  }
                }}
                isActive={activeItem === "nodes"}
                class="px-2.5 md:px-2"
              >
                {#snippet tooltipContent()}
                  Nodes
                {/snippet}
                <Server />
                <span>Nodes</span>
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>

            <!-- <Sidebar.MenuItem>
              <Sidebar.MenuButton
                tooltipContentProps={{
                  hidden: false,
                }}
                onclick={() => {
                  if (activeItem === "sessions") sidebar.toggle();
                  else {
                    activeItem = "sessions";
                    sidebar.setOpen(true);
                  }
                }}
                isActive={activeItem === "sessions"}
                class="px-2.5 md:px-2"
              >
                {#snippet tooltipContent()}
                  Sessions
                {/snippet}
                <Terminal />
                <span>Sessions</span>
              </Sidebar.MenuButton>
            </Sidebar.MenuItem> -->

            <Sidebar.MenuItem>
              <Sidebar.MenuButton
                tooltipContentProps={{
                  hidden: false,
                }}
                onclick={() => {
                  if (activeItem === "settings") sidebar.toggle();
                  else {
                    activeItem = "settings";
                    sidebar.setOpen(true);
                  }
                }}
                isActive={activeItem === "settings"}
                class="px-2.5 md:px-2"
                aria-disabled={true}
              >
                {#snippet tooltipContent()}
                  Settings
                {/snippet}
                <Cog />
                <span>Settings</span>
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>
          </Sidebar.Menu>
        </Sidebar.GroupContent>
      </Sidebar.Group>
    </Sidebar.Content>
    <Sidebar.Footer>
      <NavUser />
    </Sidebar.Footer>
  </Sidebar.Root>

  <Sidebar.Root
    collapsible="none"
    class="flex-1 flex md:w-[calc(var(--sidebar-width)-49px)]"
  >
    <Sidebar.Header class="gap-3.5 border-b p-4">
      <div class="flex w-full items-center justify-between">
        <div class="text-foreground text-base font-medium capitalize">
          {activeItem}
        </div>

        <!-- <Label class="flex items-center gap-2 text-sm">
          <span>Unreads</span>
          <Switch class="shadow-none" />
        </Label> -->
      </div>

      <!-- <Sidebar.Input placeholder="Type to search..." /> -->
    </Sidebar.Header>

    <Sidebar.Content>
      <Sidebar.Group class="px-0">
        <Sidebar.GroupContent class="overflow-hidden">
          {#if activeItem === "nodes"}
            <!-- <div>
              <pre><code>{JSON.stringify(netMap, null, 2)}</code></pre>
            </div> -->
            {#each sortPeers(netMap?.peers) as peer}
              <button
                class="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex flex-col items-start gap-2 whitespace-nowrap border-b p-4 text-sm leading-tight last:border-b-0 w-full"
                class:cursor-not-allowed={!peer.tailscaleSSHEnabled}
                disabled={!peer.tailscaleSSHEnabled}
                onclick={() => {
                  window.dockView.addPanel({
                    component: "xterm",
                    id: window.crypto.randomUUID(),
                    title: peer.name,
                    params: {
                      hostname: peer.name,
                    },
                  });
                  /* window.dockView.addPanel({
                    component: "node",
                    id: window.crypto.randomUUID(),
                    title: peer.name,
                    params: {
                      peer,
                    },
                  }); */
                }}
              >
                <h3
                  class="max-w-full overflow-hidden text-ellipsis font-semibold text-sm flex gap-1.5 items-center"
                >
                  <div
                    class="h-2.5 w-2.5 rounded-full"
                    class:bg-green-600={peer.online}
                    class:bg-red-600={!peer.online}
                  ></div>
                  {peer.name}
                </h3>

                <ul class="text-left list-disc pl-3.5">
                  {#each peer.addresses as addr}
                    <li>{addr}</li>
                  {/each}
                </ul>

                {#if peer.tailscaleSSHEnabled}
                  <div class="flex gap-1.5 items-center mt-1.5">
                    <Badge class="flex gap-1 items-center">
                      <Terminal class="h-2.5 w-2.5" />
                      SSH
                    </Badge>
                  </div>
                {/if}
              </button>
            {/each}

            {#if netMap?.self}
              <button
                class="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex flex-col items-start gap-2 whitespace-nowrap border-b p-4 text-sm leading-tight last:border-b-0 w-full cursor-not-allowed"
              >
                <h3
                  class="max-w-full overflow-hidden text-ellipsis font-semibold text-sm flex gap-1.5 items-center"
                >
                  <div
                    class="h-2.5 w-2.5 rounded-full"
                    class:bg-green-600={netMap.self.machineStatus ===
                      "MachineAuthorized"}
                    class:bg-red-600={netMap.self.machineStatus !==
                      "MachineAuthorized"}
                  ></div>
                  {netMap.self.name}
                </h3>

                <ul class="text-left list-disc pl-3.5">
                  {#each netMap.self.addresses as addr}
                    <li>{addr}</li>
                  {/each}
                </ul>

                <div class="flex gap-1.5 items-center mt-1.5">
                  {#if netMap.self.machineStatus !== "MachineAuthorized"}
                    <Badge variant="destructive">
                      {netMap.self.machineStatus}
                    </Badge>
                  {/if}
                  <Badge variant="secondary">Self</Badge>
                </div>
              </button>
            {/if}
            <!-- {:else if activeItem === "sessions"}
            {#each window.dockView.panels || [] as panel}
              {#if panel.view.content instanceof XtermPanel}
                <div>{panel.id}</div>
              {/if}
            {/each} -->
          {:else if activeItem === "settings"}
            <div>3</div>
          {/if}
        </Sidebar.GroupContent>
      </Sidebar.Group>

      <Sidebar.Group class="mt-auto pt-4 md:hidden">
        <NavUser />
      </Sidebar.Group>
    </Sidebar.Content>
  </Sidebar.Root>
</Sidebar.Root>
