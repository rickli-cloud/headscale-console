<script lang="ts">
  import { onMount } from "svelte";

  import Terminal from "lucide-svelte/icons/terminal";

  import * as Sidebar from "$lib/components/ui/sidebar";
  import * as Table from "$lib/components/ui/table";

  // import { WindowSystem } from "$lib/components/window";
  import { AppSidebar } from "$lib/components/sidebar";

  import { netMap } from "$lib/store/ipn";
  import UserMenu from "$lib/components/data/user/UserMenu.svelte";
  import Badge from "$lib/components/ui/badge/badge.svelte";
  import NodeMap from "$lib/components/data/node/NodeMap.svelte";
  import NetworkMembers from "$lib/components/data/users/NetworkMembers.svelte";

  const beforeUnloadHandler = (event: Event) => {
    // if (!(window.dockView?.panels.length > 0)) return;
    // event.preventDefault(); // Recommended
    // event.returnValue = true; // Included for legacy support, e.g. Chrome/Edge < 119
  };

  onMount(() => {
    window.addEventListener("beforeunload", beforeUnloadHandler);

    return () => {
      window.removeEventListener("beforeunload", beforeUnloadHandler);
    };
  });
</script>

<main class="max-w-screen-lg mx-auto space-y-16 px-8 py-12 h-full">
  <header class="flex gap-6 items-center mb-10 justify-between">
    <h1 class="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
      {$netMap?.self?.name
        .split(/\./g)
        .filter((_, i) => i !== 0)
        .join(".")}
    </h1>

    <UserMenu />
  </header>

  <NodeMap />

  <NetworkMembers />
</main>
