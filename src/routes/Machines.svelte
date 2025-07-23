<script lang="ts">
  import ScreenShare from "lucide-svelte/icons/screen-share";
  import Terminal from "lucide-svelte/icons/terminal";

  import NodeMap from "$lib/components/data/node/MachinesTable.svelte";

  import Layout from "../Layout.svelte";
</script>

<Layout>
  <div class="space-y-1.5">
    <h3 class="scroll-m-20 text-2xl font-semibold tracking-tight">Machines</h3>
    <p class="text-muted-foreground">
      Some devices might be hidden when access is restricted
    </p>
  </div>

  <section
    class="grid items-center gap-3 grid-cols-[repeat(auto-fill,minmax(192px,auto));]"
  >
    <a
      class="action-card h-24"
      href="#/connect?proto=rdp"
      onclick={window.appRouter.anchorOnclickHandler()}
    >
      <span class="text-sm font-semibold">Remote Desktop</span>
      <ScreenShare class="size-6 ml-auto" />
    </a>

    <a
      class="action-card h-24"
      href="#/connect?proto=vnc"
      onclick={window.appRouter.anchorOnclickHandler()}
    >
      <span class="text-sm font-semibold">VNC</span>
      <ScreenShare class="size-6 ml-auto" />
    </a>

    <a
      class="action-card h-24"
      href="#/connect?proto=ssh"
      onclick={window.appRouter.anchorOnclickHandler()}
    >
      <span class="text-sm font-semibold">SSH</span>
      <Terminal class="size-6 ml-auto" />
    </a>
  </section>

  <section class="space-y-10">
    <NodeMap />
  </section>
</Layout>
