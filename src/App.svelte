<script lang="ts">
  import { onMount } from "svelte";

  import Terminal from "lucide-svelte/icons/terminal";

  import "./app.css";

  import * as Sidebar from "$lib/components/ui/sidebar";

  import { AppSidebar } from "$lib/components/sidebar";
  import { WindowSystem } from "$lib/components/window";

  const beforeUnloadHandler = (event: Event) => {
    if (!(window.dockView?.panels.length > 0)) return;
    event.preventDefault(); // Recommended
    event.returnValue = true; // Included for legacy support, e.g. Chrome/Edge < 119
  };

  onMount(() => {
    window.addEventListener("beforeunload", beforeUnloadHandler);

    return () => {
      window.removeEventListener("beforeunload", beforeUnloadHandler);
    };
  });
</script>

<Sidebar.Provider style="--sidebar-width: 350px;" class="mt-10 md:mt-0">
  <header
    class="h-10 w-full fixed top-0 left-0 z-50 bg-sidebar border-b flex gap-2 items-center px-3 md:hidden"
  >
    <Terminal class="h-5 w-5" />

    <Sidebar.Trigger class="ml-auto" />
  </header>

  <Sidebar.Inset>
    <WindowSystem class="h-[calc(100svh-2.5rem)] md:h-full" />
  </Sidebar.Inset>

  <AppSidebar id="app-sidebar" class="pt-10 md:pt-0" />
</Sidebar.Provider>
