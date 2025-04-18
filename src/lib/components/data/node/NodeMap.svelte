<script lang="ts">
  import type { Ipn } from "$lib/types/ipn.d";
  import { netMap } from "$lib/store/ipn";

  import NodeMapItem from "./node-map-item.svelte";

  let expandedPeer = $state<string | null>(null);

  function sortPeers(peers: Ipn.Peer[]): Ipn.Peer[] {
    peers = [
      ...(peers?.filter((peer) => peer.tailscaleSSHEnabled) || []),
      ...(peers?.filter((peer) => !peer.tailscaleSSHEnabled) || []),
    ];

    peers = [
      ...peers.filter((i) => i.online),
      ...peers.filter((i) => !i.online),
    ];

    return peers;
  }
</script>

{#each sortPeers($netMap?.peers || []) as peer}
  {@const isExpanded = expandedPeer === peer.name}
  <NodeMapItem
    {peer}
    {isExpanded}
    onexpand={() => (expandedPeer = isExpanded ? null : peer.name)}
  />
{/each}

{#if $netMap?.self}
  <NodeMapItem
    peer={{
      ...$netMap.self,
      online: $netMap.self.machineStatus === "MachineAuthorized",
      tailscaleSSHEnabled: false,
    }}
  />
{/if}
