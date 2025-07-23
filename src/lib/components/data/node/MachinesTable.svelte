<script lang="ts">
  import SlidersHorizontal from "lucide-svelte/icons/sliders-horizontal";
  import MoreHorizontal from "lucide-svelte/icons/more-horizontal";
  import ExternalLink from "lucide-svelte/icons/external-link";
  import Plus from "lucide-svelte/icons/plus";

  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
  import * as HoverCard from "$lib/components/ui/hover-card";
  import * as Avatar from "$lib/components/ui/avatar";
  import * as Table from "$lib/components/ui/table";
  import { Badge } from "$lib/components/ui/badge";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";

  import { appConfig } from "$lib/store/config";
  import { shortName } from "$lib/utils/misc";
  import { netMap } from "$lib/store/ipn";
  import { cn } from "$lib/utils/shadcn";

  import MachineTableItem from "./machines-table-item.svelte";

  let filter = $state<string>("");

  const userRegex = /^userid:(\S+)$/i;
  const osRegex = /^os:(\S+)$/i;

  let filters = $derived({
    /** with `userid:` prefix */
    users: filter.split(/\s+/gm).filter((i) => i?.length && userRegex.test(i)),
    /** without `os:` prefix */
    os: filter
      .split(/\s+/gm)
      .filter((i) => i?.length && osRegex.test(i))
      .map((i) => osRegex.exec(i)?.[1])
      .filter((i) => typeof i !== "undefined"),
    text: filter
      .split(/\s+/gm)
      .filter((i) => i?.length && !userRegex.test(i) && !osRegex.test(i)),
  });

  let visiblePeers = $derived<IPNNetMapPeerNode[]>(
    sortPeers(($netMap?.peers || []).filter(filterPeer))
  );

  function filterPeer(peer: {
    os: string;
    user: string;
    name: string;
  }): boolean {
    if (filters.users.length && !filters.users.find((i) => i === peer.user)) {
      return false;
    }

    if (filters.os.length && !filters.os.includes(peer.os)) {
      return false;
    }

    if (filters.text.length) {
      for (const f of filters.text) {
        if (new RegExp(f).test(peer.name)) return true;
      }
      return false;
    }

    return true;
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

<div class="space-y-6">
  <div class="flex items-center gap-1.5">
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <Button variant="outline">
          <SlidersHorizontal />
        </Button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content align="start">
        <DropdownMenu.Group>
          <DropdownMenu.Label>Users</DropdownMenu.Label>
          <DropdownMenu.Separator />
          {#each Object.values($netMap?.users || {}) as user}
            <DropdownMenu.CheckboxItem
              checked={!filters.users.length ||
                filters.users.includes(`userid:${user.ID}`)}
              onclick={() => {
                if (
                  filters.users.length &&
                  filters.users.includes("userid:" + user.ID)
                ) {
                  filter = filter
                    .replaceAll(
                      new RegExp(`(?<!\\S)userid:${user.ID}(?!\\S)`, "g"),
                      " "
                    )
                    .trim();
                } else {
                  filter = `${filter.trim()} userid:${user.ID}`
                    .trim()
                    .replaceAll(/\s+/g, " ");
                }
              }}
            >
              {user.DisplayName}
            </DropdownMenu.CheckboxItem>
          {/each}
        </DropdownMenu.Group>

        <DropdownMenu.Group>
          <DropdownMenu.Label>OS</DropdownMenu.Label>
          <DropdownMenu.Separator />
          {#each new Set( [...($netMap?.peers || []).map((i) => i.os), "js"] ) as os}
            <DropdownMenu.CheckboxItem
              checked={!filters.os.length || filters.os.includes(os)}
              onclick={() => {
                if (filters.os.length && filters.os.includes(os)) {
                  filter = filter
                    .replaceAll(new RegExp(`(?<!\\S)os:${os}(?!\\S)`, "g"), " ")
                    .trim();
                } else {
                  filter = `${filter.trim()} os:${os}`
                    .trim()
                    .replaceAll(/\s+/g, " ");
                }
              }}
            >
              {os}
            </DropdownMenu.CheckboxItem>
          {/each}
        </DropdownMenu.Group>
      </DropdownMenu.Content>
    </DropdownMenu.Root>

    <Input
      placeholder="search"
      class="min-w-24 max-w-[812px]"
      bind:value={filter}
    />

    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        {#snippet child({ props })}
          <Button {...props} class="ml-auto hidden sm:flex">
            <Plus />
            Add device
          </Button>
        {/snippet}
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Group>
          {#each ["windows", "apple"] as link}
            <DropdownMenu.Item>
              <a
                class="h-full w-full flex items-center gap-1.5 justify-between capitalize"
                href={(() => {
                  const url = new URL($appConfig.controlUrl);
                  url.pathname = `/${link}`;
                  return url.toString();
                })()}
                target="_blank"
              >
                {link}
                <ExternalLink class="size-3.5" />
              </a>
            </DropdownMenu.Item>
          {/each}
        </DropdownMenu.Group>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  </div>

  <div></div>
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
    {#if $netMap?.self && filterPeer( { os: "js", user: `userid:${window.ipnProfiles?.currentProfile?.Config.UserProfile.ID}`, name: $netMap.self.name } )}
      <Table.Row>
        <Table.Cell class="space-y-1 !align-top">
          <p class="font-semibold">
            {$netMap.self.name.split(/\./)[0]}
          </p>

          <p class="text-muted-foreground">
            <HoverCard.Root>
              <HoverCard.Trigger class="hover:underline">
                {window.ipnProfiles?.currentProfile?.Config.UserProfile
                  .DisplayName}
              </HoverCard.Trigger>

              <HoverCard.Content side="right">
                <div class="flex items-center gap-2 text-left text-sm">
                  <Avatar.Root class="h-8 w-8 rounded-lg">
                    <!-- <Avatar.Image src={user.avatar} alt={user.name} /> -->
                    <Avatar.Fallback class="rounded-lg">
                      {shortName(
                        window.ipnProfiles?.currentProfile?.Config.UserProfile
                          .DisplayName ||
                          window.ipnProfiles?.currentProfile?.Config.UserProfile
                            .LoginName ||
                          window.ipnProfiles?.currentProfile?.Config.UserProfile
                            .ID
                      )}
                    </Avatar.Fallback>
                  </Avatar.Root>
                  <div
                    class="grid flex-1 text-left text-sm leading-tight gap-0.5"
                  >
                    <p class="truncate font-semibold">
                      {window.ipnProfiles?.currentProfile?.Config.UserProfile
                        .DisplayName}
                    </p>
                    <p class="truncate text-xs">
                      {window.ipnProfiles?.currentProfile?.Config.UserProfile
                        .LoginName}
                    </p>
                  </div>
                </div>
              </HoverCard.Content>
            </HoverCard.Root>
          </p>

          <div class="!mt-2 max-w-96 flex flex-wrap gap-1.5 items-center">
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
      <MachineTableItem {peer} />
    {/each}
  </Table.Body>
</Table.Root>
