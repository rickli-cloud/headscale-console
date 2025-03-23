<script lang="ts">
  import Badge from "$lib/components/ui/badge/badge.svelte";
  import Secret from "$lib/components/utils/Secret.svelte";
  import { XtermPanel } from "$lib/components/window";
  import type { Tailscale } from "$lib/types/tailscale";

  interface Props {
    peer: Tailscale.Peer;
  }

  const { peer }: Props = $props();
</script>

{#if peer}
  <div class="px-4 py-6 space-y-6">
    <h2
      class="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 overflow-hidden text-ellipsis whitespace-nowrap"
    >
      {peer.name}
    </h2>

    <div class="flex gap-1.5 items-center">
      <Badge variant={peer.online ? "positive" : "destructive"}>
        {peer.online ? "Online" : "Offline"}
      </Badge>

      {#if peer.tailscaleSSHEnabled}
        <Badge>SSH</Badge>
      {/if}
    </div>

    <div>
      <h4 class="scroll-m-20 text-xl font-semibold tracking-tight">
        Addresses
      </h4>
      <ul class="my-3 ml-6 list-disc [&>li]:mt-2">
        {#each peer.addresses as addr}
          <li>{addr}</li>
        {/each}
      </ul>
    </div>

    <div class="space-y-3">
      <h4 class="scroll-m-20 text-xl font-semibold tracking-tight">
        Machine Key
      </h4>
      <Secret secret={peer.machineKey?.replace(/^mkey:/, "")} />
    </div>

    <div class="space-y-3">
      <h4 class="scroll-m-20 text-xl font-semibold tracking-tight">Node Key</h4>
      <Secret secret={peer.nodeKey?.replace(/^nodekey:/, "")} />
    </div>

    {#if "tailscaleSSHEnabled" in peer}
      <div class="space-y-3">
        <h4 class="scroll-m-20 text-xl font-semibold tracking-tight">
          SSH Sessions
        </h4>
        <div>
          {#each window.dockView.panels as panel}
            {#if panel.view.content instanceof XtermPanel && panel.params?.hostname === peer.name}
              {panel.id}
              {#key panel.view.content.username}
                {panel.view.content.username}
              {/key}
            {/if}
          {/each}
        </div>
      </div>
    {/if}
  </div>
{/if}
