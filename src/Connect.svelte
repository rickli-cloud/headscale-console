<script lang="ts">
  import IronRdp from "$lib/components/connect/IronRDP.svelte";
  import NoVnc from "$lib/components/connect/NoVNC.svelte";
  import Xterm from "$lib/components/connect/Xterm.svelte";

  import { decodeConnectParams, type ConnectParams } from "$lib/utils/connect";
  import { onMount } from "svelte";

  let connectParams = $state<ConnectParams>();
  let err = $state<unknown>();

  onMount(() => {
    try {
      document.body.classList.add("overflow-hidden");
      const params = new URLSearchParams(window.location.search);
      const rawConnectParams = params.get("opt");

      connectParams = rawConnectParams
        ? decodeConnectParams(rawConnectParams)
        : undefined;
    } catch (e) {
      err = e;
    }

    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  });
</script>

<main class="h-screen w-screen overflow-hidden">
  {#if connectParams?.proto === "ssh"}
    <Xterm hostname={connectParams.host!} />
  {:else if connectParams?.proto === "vnc"}
    <NoVnc hostname={connectParams.host!} />
  {:else if connectParams?.proto === "rdp"}
    <IronRdp hostname={connectParams.host!} />
  {:else}
    <div class="p-8 space-y-6 max-w-screen-sm mx-auto">
      <div class="space-y-3">
        <h1 class="text-3xl font-semibold">Invalid Connect Parameters</h1>
        <hr />
      </div>
      {#if err}
        <div class="">
          <p
            class="bg-destructive text-destructive-foreground text-sm px-2 py-1 border-t rounded-t font-semibold"
          >
            Error
          </p>
          <pre
            class="bg-muted text-muted-foreground w-full min-h-4 px-4 py-2 break-words overflow-x-scroll whitespace-break-spaces rounded-b"><code
              >{err?.toString()}</code
            ></pre>
        </div>
      {/if}

      <div class="">
        <p
          class="bg-primary text-primary-foreground text-sm px-2 py-1 border-t rounded-t font-semibold"
        >
          Data
        </p>
        <pre
          class="bg-muted text-muted-foreground w-full min-h-4 px-4 py-2 break-words overflow-x-scroll whitespace-break-spaces rounded-b"><code
            >{typeof connectParams === "undefined"
              ? "undefined"
              : JSON.stringify(connectParams, null, 2)}</code
          ></pre>
      </div>
    </div>
  {/if}
</main>
