<script lang="ts">
  import IronRdp from "$lib/components/connect/IronRDP.svelte";
  import NoVnc from "$lib/components/connect/NoVNC.svelte";
  import Xterm from "$lib/components/connect/Xterm.svelte";

  import { decodeConnectParams } from "$lib/utils/connect";
  import { getPathParams } from "$lib/utils/router";

  const params = new URLSearchParams(getPathParams(window.location.hash));

  const rawConnectParams = params.get("opt");

  const connectParams = rawConnectParams
    ? decodeConnectParams(rawConnectParams)
    : undefined;
</script>

<main class="h-screen w-screen">
  {#if connectParams?.proto === "ssh"}
    <Xterm hostname={connectParams.host!} />
  {:else if connectParams?.proto === "vnc"}
    <NoVnc hostname={connectParams.host!} />
  {:else if connectParams?.proto === "rdp"}
    <IronRdp hostname={connectParams.host!} />
  {:else}
    <pre class="m-8"><code>{JSON.stringify(connectParams, null, 2)}</code></pre>
  {/if}
</main>
