<script lang="ts">
  import NetworkMembers from "$lib/components/data/user/NetworkMembers.svelte";
  import UserMenu from "$lib/components/data/user/UserMenu.svelte";
  import NodeMap from "$lib/components/data/node/NodeMap.svelte";

  import { netMap } from "$lib/store/ipn";
</script>

<main class="max-w-screen-lg mx-auto space-y-16 px-8 py-12 h-full">
  <header class="flex gap-6 items-center mb-10 justify-between">
    <h1 class="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
      {$netMap?.domain}
    </h1>

    <UserMenu />
  </header>

  <NodeMap />

  <NetworkMembers />
</main>
