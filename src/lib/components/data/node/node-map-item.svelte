<script lang="ts">
  import type { IDockviewPanel } from "dockview-core";
  import { onMount } from "svelte";

  import MoreHorizontal from "lucide-svelte/icons/more-horizontal";
  import ScreenShare from "lucide-svelte/icons/screen-share";
  import Terminal from "lucide-svelte/icons/terminal";
  import WifiOff from "lucide-svelte/icons/wifi-off";
  import Clock from "lucide-svelte/icons/clock";
  import Wifi from "lucide-svelte/icons/wifi";

  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";

  import { type XtermPanelParams } from "$lib/components/window/panels/xterm";
  import { type NoVNCPanelParams } from "$lib/components/window/panels/novnc";
  import { BasePanel } from "$lib/components/window/panels/base";
  import type { Ipn } from "$lib/types/ipn.d";
  import { cn } from "$lib/utils/shadcn";
  import Time from "$lib/components/utils/Time.svelte";
  import type { IronRdpPanelParams } from "$lib/components/window/panels/ironrdp";

  interface Props {
    peer: Ipn.Peer & { machineStatus?: string };
    onexpand?: () => void;
    isExpanded?: boolean;
  }

  let { peer, onexpand, isExpanded }: Props = $props();

  let panels = $state<IDockviewPanel[]>();

  let self = $derived(typeof peer.machineStatus === "string");
  let activeSession = $derived(
    (panels || []).filter((panel) => panel.params?.hostname === peer.name)
  );

  function parseName(name: string): string {
    return name.split(/\./)[0];
  }

  onMount(() => {
    const addPanelListener = window.dockView?.onDidAddPanel(
      () => (panels = window.dockView.panels)
    );
    const removePanelListener = window.dockView?.onDidRemovePanel(
      () => (panels = window.dockView.panels)
    );

    panels = window.dockView.panels;

    return () => {
      addPanelListener.dispose();
      removePanelListener.dispose();
    };
  });

  function openSshPanel() {
    const params: XtermPanelParams = {
      hostname: peer.name,
    };

    window.dockView.addPanel({
      id: window.crypto.randomUUID(),
      title: parseName(peer.name),
      component: "xterm",
      params,
    });
  }

  function openVncPanel() {
    const params: NoVNCPanelParams = {
      hostname: peer.name,
      port: 5900,
    };

    window.dockView.addPanel({
      id: window.crypto.randomUUID(),
      title: parseName(peer.name),
      component: "novnc",
      params,
    });
  }

  function openRdpPanel() {
    const params: IronRdpPanelParams = {
      hostname: peer.name,
      port: 3389,
    };

    window.dockView.addPanel({
      id: window.crypto.randomUUID(),
      title: parseName(peer.name),
      component: "ironrdp",
      params,
    });
  }
</script>

<div class="border-b space-y-2 last:border-b-0">
  <button
    class="p-4 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex flex-col items-start gap-2 whitespace-nowrap text-sm leading-tight w-full"
    class:bg-sidebar-accent={isExpanded}
    disabled={self}
    onclick={(ev) => {
      if (ev.shiftKey && !self && peer.online && peer.tailscaleSSHEnabled) {
        openSshPanel();
      } else if (ev.shiftKey && !self && peer.online) {
        openVncPanel();
      } else {
        onexpand?.();
      }
    }}
  >
    <div class="flex gap-4 justify-between items-center w-full">
      <h3
        class="max-w-full overflow-hidden text-ellipsis font-semibold text-sm flex gap-1.5 items-center"
      >
        <div>
          {#if peer.online}
            <Wifi class="h-3.5 w-3.5 text-green-600" />
          {:else}
            <WifiOff class="h-3.5 w-3.5 text-muted-foreground" />
          {/if}
        </div>

        <p>
          {parseName(peer.name)}
        </p>
      </h3>

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
            disabled={self || !peer.online || !peer.tailscaleSSHEnabled}
            onclick={openSshPanel}
          >
            <Terminal class="mr-2 size-3" />
            New SSH Session
          </DropdownMenu.Item>

          <DropdownMenu.Item
            class="text-xs cursor-pointer"
            disabled={self || !peer.online}
            onclick={openVncPanel}
          >
            <ScreenShare class="mr-2 size-3" />
            New VNC Session
          </DropdownMenu.Item>

          <DropdownMenu.Item
            class="text-xs cursor-pointer"
            disabled={self || !peer.online}
            onclick={openRdpPanel}
          >
            <ScreenShare class="mr-2 size-3" />
            New RDP Session
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>

    <div class="flex gap-4 w-full justify-between">
      <ul class="text-left text-muted-foreground text-xs">
        {#each peer.addresses as addr}
          <li>{addr}</li>
        {/each}
      </ul>

      <div>
        <div class="flex flex-wrap items-center gap-1.5 flex-row-reverse">
          {#if peer.tailscaleSSHEnabled}
            <Badge class="flex gap-1 items-center text-[10px] h-5 px-1.5">
              <Terminal class="size-2.5" />
              SSH
            </Badge>
          {/if}

          {#if self}
            {#if peer.machineStatus !== "MachineAuthorized"}
              <Badge variant="destructive" class="text-[10px] h-5 px-1.5">
                {peer.machineStatus}
              </Badge>
            {/if}

            <Badge
              variant="outline"
              class="text-[10px] h-5 px-1.5 border-muted-foreground"
            >
              Self
            </Badge>
          {/if}

          {#if activeSession.length > 0}
            <Badge
              variant="outline"
              class="text-[10px] h-5 px-1.5 border-muted-foreground"
            >
              {activeSession.length} Session{activeSession.length > 1
                ? "s"
                : ""}
            </Badge>
          {/if}
        </div>
      </div>
    </div>
  </button>

  {#if isExpanded}
    <div class=" space-y-2 w-full text-left px-4 pb-4">
      <h4 class="text-sm">Active Sessions</h4>

      {#if activeSession?.length}
        <div class="">
          {#each activeSession as panel}
            <button
              class="w-full p-1.5 flex gap-3 items-center justify-between hover:bg-sidebar-accent border-b last:border-b-0"
              onclick={() => panel.focus()}
            >
              {#if panel.api.component === "xterm"}
                <p class="flex gap-1.5 items-center text-xs">
                  <Terminal class="size-3" />
                  SSH
                </p>
              {:else if panel.api.component === "novnc"}
                <p class="flex gap-1.5 items-center text-xs">
                  <ScreenShare class="size-3" />
                  VNC
                </p>
              {:else if panel.api.component === "ironrdp"}
                <p class="flex gap-1.5 items-center text-xs">
                  <ScreenShare class="size-3" />
                  RDP
                </p>
              {/if}

              {#if panel.view.content instanceof BasePanel}
                <p class="flex gap-1.5 items-center text-xs">
                  <Clock class="size-3" />
                  <Time createdAt={panel.view.content.createdAt} />
                </p>
              {/if}
            </button>
          {/each}
        </div>
      {:else}
        <p class="text-xs text-muted-foreground">None</p>
      {/if}
    </div>
  {/if}
</div>
