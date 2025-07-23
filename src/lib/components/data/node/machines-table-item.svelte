<script lang="ts">
  import MoreHorizontal from "lucide-svelte/icons/more-horizontal";
  import ScreenShare from "lucide-svelte/icons/screen-share";
  import ClockAlert from "lucide-svelte/icons/clock-alert";
  import ShieldOff from "lucide-svelte/icons/shield-off";
  import DoorOpen from "lucide-svelte/icons/door-open";
  import Terminal from "lucide-svelte/icons/terminal";
  import Trash from "lucide-svelte/icons/trash-2";

  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
  import * as HoverCard from "$lib/components/ui/hover-card";
  import * as Avatar from "$lib/components/ui/avatar";
  import * as Table from "$lib/components/ui/table";
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";

  import ConfirmAction from "$lib/components/utils/ConfirmAction.svelte";

  import { selfserviceCap } from "$lib/store/selfservice";
  import { SelfService } from "$lib/api/self-service";
  import { appConfig } from "$lib/store/config";
  import { shortName } from "$lib/utils/misc";
  import { netMap } from "$lib/store/ipn";
  import { cn } from "$lib/utils/shadcn";

  interface Props {
    peer: IPNNetMapPeerNode;
  }

  let { peer }: Props = $props();

  let user = $derived($netMap?.users[peer.user?.replace(/^userid:/, "")]);
  let isOwned = $derived(
    Number(user?.ID) ===
      window.ipnProfiles?.currentProfile?.Config?.UserProfile?.ID
  );

  let confirmExpire = $state<ConfirmAction>();
  let confirmDelete = $state<ConfirmAction>();

  function parseName(name: string): string {
    return name.split(/\./)[0];
  }

  function connectURL(proto: string) {
    const url = new URL(window.location.href);
    const params = new URLSearchParams();
    params.set("proto", proto);
    params.set("host", peer.name.split(".")[0]);
    url.hash = `#/connect?${params.toString()}`;
    return url;
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
            <div class="grid flex-1 text-left text-sm leading-tight gap-0.5">
              <p class="truncate font-semibold">{user?.DisplayName}</p>
              <p class="truncate text-xs">{user?.LoginName}</p>
            </div>
          </div>
        </HoverCard.Content>
      </HoverCard.Root>
    </p>

    <div
      class="!mt-2 max-w-96 flex flex-wrap gap-1.5 items-center empty:hidden [&>span]:text-[10px] [&>span]:h-5 [&>span]:px-1.5"
    >
      {#if peer.expired}
        <Badge
          variant="outline"
          class="flex gap-1 items-center border-destructive text-destructive"
        >
          <ClockAlert class="size-2.5" />
          <span>Expired</span>
        </Badge>
      {/if}

      {#if peer.tailscaleSSHEnabled}
        <Badge variant="outline" class="flex gap-1 items-center">
          <Terminal class="size-2.5" />
          <span>SSH</span>
        </Badge>
      {/if}

      {#if peer.routes?.find((i) => i === "0.0.0.0/0") || peer.routes?.find((i) => i === "::/0")}
        <Badge variant="outline" class="flex gap-1 items-center">
          <DoorOpen class="size-2.5" />
          <span>Exit Node</span>
        </Badge>
      {/if}

      {#each peer.tags || [] as tag}
        <Badge variant="secondary">
          {tag}
        </Badge>
      {/each}
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
        <DropdownMenu.Group>
          {@const sshURL = connectURL("ssh")}
          <DropdownMenu.Item
            class="text-xs cursor-pointer"
            disabled={!peer.online || !peer.tailscaleSSHEnabled}
            onclick={() => window.appRouter.goto(sshURL)}
          >
            <a
              href={sshURL.toString()}
              class="w-full h-full flex items-center gap-2"
            >
              <Terminal class="mr-2 size-4" />
              <span>SSH</span>
            </a>
          </DropdownMenu.Item>

          {@const vncURL = connectURL("vnc")}
          <DropdownMenu.Item
            class="text-xs cursor-pointer"
            disabled={!peer.online || peer.os === "js"}
            onclick={() => window.appRouter.goto(vncURL)}
          >
            <a
              href={vncURL.toString()}
              class="w-full h-full flex items-center gap-2"
            >
              <ScreenShare class="mr-2 size-4" />
              <span>VNC</span>
            </a>
          </DropdownMenu.Item>

          {@const rdpURL = connectURL("rdp")}
          <DropdownMenu.Item
            class="text-xs cursor-pointer"
            disabled={!peer.online || peer.os === "js"}
            onclick={() => window.appRouter.goto(rdpURL)}
          >
            <a
              href={rdpURL.toString()}
              class="w-full h-full flex items-center gap-2"
            >
              <ScreenShare class="mr-2 size-4" />
              RDP
            </a>
          </DropdownMenu.Item>
        </DropdownMenu.Group>

        {#if $appConfig.selfserviceHostname}
          <DropdownMenu.Separator />

          <DropdownMenu.Group>
            <DropdownMenu.Item
              class="text-xs cursor-pointer hover:!text-red-600"
              disabled={typeof $selfserviceCap === "undefined" ||
                !isOwned ||
                peer.expired}
              onclick={() => confirmExpire?.open()}
            >
              <ShieldOff class="mr-2 size-4" />
              Expire Session
            </DropdownMenu.Item>

            <DropdownMenu.Item
              class="text-xs cursor-pointer hover:!text-red-600"
              disabled={typeof $selfserviceCap === "undefined" ||
                !$selfserviceCap?.nodeDeletion ||
                !isOwned}
              onclick={() => confirmDelete?.open()}
            >
              <Trash class="mr-2 size-4" />
              Delete
            </DropdownMenu.Item>
          </DropdownMenu.Group>
        {/if}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  </Table.Cell>
</Table.Row>

<ConfirmAction
  bind:this={confirmExpire}
  action={() => SelfService.expireNode(peer.id)}
/>

<ConfirmAction
  bind:this={confirmDelete}
  action={() => SelfService.deleteNode(peer.id)}
/>
