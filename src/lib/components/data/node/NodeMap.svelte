<script lang="ts">
  import MoreHorizontal from "lucide-svelte/icons/more-horizontal";

  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
  import * as HoverCard from "$lib/components/ui/hover-card";
  import * as Avatar from "$lib/components/ui/avatar";
  import * as Table from "$lib/components/ui/table";
  import { Badge } from "$lib/components/ui/badge";
  import { Button } from "$lib/components/ui/button";
  import { Toggle } from "$lib/components/ui/toggle";
  import { Input } from "$lib/components/ui/input";

  import { shortName } from "$lib/utils/misc";
  import { netMap } from "$lib/store/ipn";
  import { cn } from "$lib/utils/shadcn";

  import NodeMapItem from "./node-map-item.svelte";

  let showOwned = $state<boolean>(true);
  let showExternal = $state<boolean>(true);

  let visiblePeers = $derived<IPNNetMapPeerNode[]>(
    sortPeers(filterPeers($netMap?.peers || []))
  );

  function filterPeers(peers: IPNNetMapPeerNode[]): IPNNetMapPeerNode[] {
    if (showOwned && showExternal) return peers;

    const result: IPNNetMapPeerNode[] = [];

    for (const peer of peers) {
      if (
        peer.user?.replace(/^userid:/, "") ===
        window.ipnProfile?.Config?.UserProfile?.ID?.toString()
      ) {
        if (showOwned) result.push(peer);
      } else if (showExternal) {
        result.push(peer);
      }
    }
    return result;
  }

  function sortPeers(peers: IPNNetMapPeerNode[]): IPNNetMapPeerNode[] {
    peers = [
      ...(peers?.filter((peer) => !peer.expired && peer.tailscaleSSHEnabled) ||
        []),
      ...(peers?.filter((peer) => !peer.expired && !peer.tailscaleSSHEnabled) ||
        []),
      ...(peers?.filter((peer) => peer.expired) || []),
    ];

    peers = [
      ...peers.filter((i) => i.online),
      ...peers.filter((i) => !i.online),
    ];

    return peers;
  }
</script>

<section class="space-y-10">
  <div class="space-y-4">
    <h3 class="scroll-m-20 text-2xl font-semibold tracking-tight">Machines</h3>

    <div
      class="grid grid-cols-[152px,1fr,min(calc(100%-152px-12px),256px)] gap-1.5"
    >
      <div class="grid grid-cols-2 gap-1.5">
        <Toggle bind:pressed={showOwned}>Owned</Toggle>
        <Toggle bind:pressed={showExternal}>External</Toggle>
      </div>

      <div></div>

      <Input placeholder="search" disabled />
    </div>
  </div>

  <Table.Root>
    <Table.Header>
      <Table.Row class="capitalize">
        <Table.Head>machine</Table.Head>
        <Table.Head>IP</Table.Head>
        <Table.Head>OS</Table.Head>
        <Table.Head>last seen</Table.Head>
        <Table.Head class="w-4"></Table.Head>
      </Table.Row>
    </Table.Header>

    <Table.Body class="!whitespace-nowrap">
      {#if $netMap?.self && showOwned}
        <Table.Row>
          <Table.Cell class="space-y-1 !align-top">
            <p class="font-semibold">
              {$netMap.self.name.split(/\./)[0]}
            </p>

            <p class="text-muted-foreground">
              <HoverCard.Root>
                <HoverCard.Trigger class="hover:underline">
                  {window.ipnProfile?.Config.UserProfile.DisplayName}
                </HoverCard.Trigger>

                <HoverCard.Content side="right">
                  <div class="flex items-center gap-2 text-left text-sm">
                    <Avatar.Root class="h-8 w-8 rounded-lg">
                      <!-- <Avatar.Image src={user.avatar} alt={user.name} /> -->
                      <Avatar.Fallback class="rounded-lg">
                        {shortName(
                          window.ipnProfile?.Config.UserProfile.DisplayName ||
                            window.ipnProfile?.Config.UserProfile.LoginName ||
                            window.ipnProfile?.Config.UserProfile.ID
                        )}
                      </Avatar.Fallback>
                    </Avatar.Root>
                    <div class="grid flex-1 text-left text-sm leading-tight">
                      <span class="truncate font-semibold"
                        >{window.ipnProfile?.Config.UserProfile
                          .DisplayName}</span
                      >
                      <span class="truncate text-xs"
                        >{window.ipnProfile?.Config.UserProfile.LoginName}</span
                      >
                    </div>
                  </div>
                </HoverCard.Content>
              </HoverCard.Root>
            </p>

            <div class="!mt-2 max-w-96 flex flex-wrap gap-1.5 items-center">
              <!-- <Badge class="flex gap-1 items-center text-[10px] h-5 px-1.5">
                Owner
              </Badge> -->

              <Badge
                variant="outline"
                class="flex gap-1 items-center text-[10px] h-5 px-1.5"
              >
                Self
              </Badge>
            </div>
          </Table.Cell>

          <Table.Cell class="space-y-1 !align-top">
            {#each $netMap.self.addresses as addr}
              <p>
                {addr}
              </p>
            {/each}
          </Table.Cell>

          <Table.Cell class="space-y-1 !align-top">
            <div>js</div>
            <div class="text-muted-foreground text-xs">
              {$netMap.self.ipnVersion}
            </div>
          </Table.Cell>

          <Table.Cell class="space-y-1.5 !align-top">
            <div class="flex items-center gap-1.5 text-xs">
              <div class="rounded full w-2 h-2 mt-0.5 bg-green-600"></div>
              <span>Connected</span>
            </div>

            <div class="text-xs text-muted-foreground">
              Created: {$netMap.self.createdAt
                ? new Date($netMap.self.createdAt).toLocaleString()
                : "Unknown"}
            </div>
          </Table.Cell>

          <Table.Cell class="!align-top flex flex-col gap-1.5">
            <DropdownMenu.Root>
              <DropdownMenu.Trigger class="ml-auto">
                {#snippet child({ props })}
                  <Button
                    {...props}
                    variant="ghost"
                    size="icon"
                    class={cn("h-6 w-6", props.class || "")}
                    disabled
                  >
                    <MoreHorizontal class="size-3" />
                    <span class="sr-only">More options</span>
                  </Button>
                {/snippet}
              </DropdownMenu.Trigger>

              <DropdownMenu.Content align="end" class="w-[160px]"
              ></DropdownMenu.Content>
            </DropdownMenu.Root>
          </Table.Cell>
        </Table.Row>
      {/if}

      {#each visiblePeers as peer}
        <NodeMapItem {peer} />
      {/each}
    </Table.Body>
  </Table.Root>
</section>
