<script lang="ts">
  import MoreHorizontal from "lucide-svelte/icons/more-horizontal";
  import ScreenShare from "lucide-svelte/icons/screen-share";
  import DoorOpen from "lucide-svelte/icons/door-open";
  import Terminal from "lucide-svelte/icons/terminal";

  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
  import * as HoverCard from "$lib/components/ui/hover-card";
  import * as Avatar from "$lib/components/ui/avatar";
  import * as Table from "$lib/components/ui/table";
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";

  import { encodeConnectParams, type ConnectParams } from "$lib/utils/connect";
  import { getPathParams } from "$lib/utils/router";
  import { shortName } from "$lib/utils/misc";
  import { netMap } from "$lib/store/ipn";
  import { cn } from "$lib/utils/shadcn";

  interface Props {
    peer: IPNNetMapPeerNode;
  }

  let { peer }: Props = $props();

  let user = $derived($netMap?.users[peer.user?.replace(/^userid:/, "")]);

  function parseName(name: string): string {
    return name.split(/\./)[0];
  }

  function handleConnect(proto: ConnectParams["proto"]) {
    const params = new URLSearchParams(getPathParams(window.location.hash));

    params.set("opt", encodeConnectParams({ host: peer.name, proto }));

    const loc = new URL(window.location.href);
    loc.hash = `#/connect?${params.toString()}`;

    // TODO: option to enable/disable popup
    window.open(loc.toString(), "_blank", "popup")?.focus();
  }
</script>

<Table.Row>
  <Table.Cell class="space-y-1 !align-top">
    <p class="font-semibold">
      {parseName(peer.name)}
    </p>

    <p class="text-muted-foreground">
      <HoverCard.Root>
        <HoverCard.Trigger class="hover:underline">
          {user?.DisplayName}
        </HoverCard.Trigger>

        <HoverCard.Content side="right">
          <div class="flex items-center gap-2 text-left text-sm">
            <Avatar.Root class="h-8 w-8 rounded-lg">
              <!-- <Avatar.Image src={user.avatar} alt={user.name} /> -->
              <Avatar.Fallback class="rounded-lg">
                {shortName(user?.DisplayName || user?.LoginName || user?.ID)}
              </Avatar.Fallback>
            </Avatar.Root>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-semibold">{user?.DisplayName}</span>
              <span class="truncate text-xs">{user?.LoginName}</span>
            </div>
          </div>
        </HoverCard.Content>
      </HoverCard.Root>
    </p>

    <div
      class="!mt-2 max-w-96 flex flex-wrap gap-1.5 items-center empty:hidden"
    >
      <!-- {#if peer.user.replace(/^userid:/, "") === window.ipnProfile?.Config?.UserProfile?.ID?.toString()}
        <Badge class="flex gap-1 items-center text-[10px] h-5 px-1.5">
          Owner
        </Badge>
      {/if} -->

      {#if peer.tailscaleSSHEnabled}
        <Badge
          variant="outline"
          class="flex gap-1 items-center text-[10px] h-5 px-1.5"
        >
          <Terminal class="size-2.5" />
          <span>SSH</span>
        </Badge>
      {/if}

      {#if peer.routes?.find((i) => i === "0.0.0.0/0") || peer.routes?.find((i) => i === "::/0")}
        <Badge
          variant="outline"
          class="flex gap-1 items-center text-[10px] h-5 px-1.5"
        >
          <DoorOpen class="size-2.5" />
          <span>Exit Node</span>
        </Badge>
      {/if}
    </div>
  </Table.Cell>

  <Table.Cell class="space-y-1 !align-top">
    {#each [...peer.addresses, ...(peer.routes || [])] as addr}
      <p>
        {addr}
      </p>
    {/each}
  </Table.Cell>

  <Table.Cell class="space-y-1 !align-top">
    <div>
      {peer.os}
      <span class="text-xs text-muted-foreground">
        {peer.osVersion}
      </span>
    </div>

    <div class="text-muted-foreground text-xs">
      {peer.ipnVersion}
    </div>
  </Table.Cell>

  <Table.Cell class="space-y-1.5 !align-top">
    <div class="flex items-center gap-1.5 text-xs">
      <div
        class="rounded full w-2 h-2 mt-0.5"
        class:bg-green-600={peer.online}
        class:bg-muted={!peer.online}
      ></div>
      <span class:text-muted-foreground={!peer.online}>
        {peer.online
          ? "Connected"
          : peer.lastSeen
            ? new Date(peer.lastSeen).toLocaleString()
            : "Unknown"}
      </span>
    </div>

    <div class="text-xs text-muted-foreground">
      Created: {peer.createdAt
        ? new Date(peer.createdAt).toLocaleString()
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
          >
            <MoreHorizontal class="size-3" />
            <span class="sr-only">More options</span>
          </Button>
        {/snippet}
      </DropdownMenu.Trigger>

      <DropdownMenu.Content align="end" class="w-[160px]">
        <DropdownMenu.Item
          class="text-xs cursor-pointer"
          disabled={!peer.online || !peer.tailscaleSSHEnabled}
          onclick={() => handleConnect("ssh")}
        >
          <Terminal class="mr-2 size-3" />
          SSH
        </DropdownMenu.Item>

        <DropdownMenu.Item
          class="text-xs cursor-pointer"
          disabled={!peer.online || peer.os === "js"}
          onclick={() => handleConnect("vnc")}
        >
          <ScreenShare class="mr-2 size-3" />
          VNC
        </DropdownMenu.Item>

        <DropdownMenu.Item
          class="text-xs cursor-pointer"
          disabled={!peer.online || peer.os === "js"}
          onclick={() => handleConnect("rdp")}
        >
          <ScreenShare class="mr-2 size-3" />
          RDP
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  </Table.Cell>
</Table.Row>
