<script lang="ts">
  import { onMount } from "svelte";

  import IronRdp from "$lib/components/connect/IronRDP.svelte";
  import NoVnc from "$lib/components/connect/NoVNC.svelte";
  import Xterm from "$lib/components/connect/Xterm.svelte";

  let proto = $state<string>();
  let hostname = $state<string>();
  let port = $state<string>();

  onMount(() => {
    document.body.classList.add("overflow-hidden");

    const params = window.appRouter.searchParams;

    proto = params.get("proto") || undefined;
    hostname = params.get("host") || undefined;
    port = params.get("port") || undefined;

    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  });
</script>

<main class="h-screen w-screen overflow-hidden">
  {#if proto === "ssh"}
    <Xterm hostname={hostname!} />
  {:else if proto === "vnc"}
    <NoVnc {hostname} />
  {:else if proto === "rdp"}
    <IronRdp {hostname} />
  {:else}
    <div class="space-y-4 p-8">
      <h1 class="text-3xl font-semibold">
        Unsupported or missing connect protocol
      </h1>
      <pre class="text-muted-foreground"><code
          >Protocol: {JSON.stringify(proto)}</code
        ></pre>
    </div>
  {/if}
</main>
