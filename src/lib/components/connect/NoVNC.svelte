<script lang="ts">
  import NoVncClient from "@novnc/novnc/lib/rfb";
  import { onMount } from "svelte";

  import TriangleAlert from "lucide-svelte/icons/triangle-alert";
  import ArrowLeft from "lucide-svelte/icons/arrow-left";

  import * as Alert from "$lib/components/ui/alert";
  import { Button } from "$lib/components/ui/button";
  import { Label } from "$lib/components/ui/label";
  import { Input } from "$lib/components/ui/input";

  import { IpnRawTcpChannel } from "$lib/api/tsconnect";

  interface Props {
    hostname: string;
    port?: number;
  }

  const { hostname: initialHostname, port: initialPort = 5900 }: Props =
    $props();

  let port = $state<number>(initialPort);
  let hostname = $state<string>(initialHostname);
  let username = $state<string>("");
  let password = $state<string>("");

  let rawChannel = $state<IpnRawTcpChannel | undefined>();
  let noVncClient = $state<NoVncClient | undefined>();

  let isLoading = $state<boolean>(false);
  let isLoggedIn = $state<boolean>(false);
  let errorMessage = $state<unknown>();

  let el: HTMLDivElement;

  onMount(() => {
    window.addEventListener("beforeunload", beforeUnloadHandler);

    return () => {
      window.removeEventListener("beforeunload", beforeUnloadHandler);
      noVncClient?.disconnect();
      rawChannel?.close();
    };
  });

  const beforeUnloadHandler = (event: Event) => {
    if (!isLoggedIn) return;
    event.preventDefault(); // Recommended
    event.returnValue = true; // Included for legacy support, e.g. Chrome/Edge < 119
  };

  async function onLogin() {
    if (isLoading) return;
    try {
      isLoading = true;
      errorMessage = undefined;

      if (rawChannel) rawChannel.close();

      rawChannel = await IpnRawTcpChannel.connect({
        port,
        hostname,
      });

      noVncClient = new NoVncClient(el, rawChannel, {
        credentials: { password, username, target: "" },
      });

      noVncClient.scaleViewport = true;
      noVncClient.resizeSession = true;

      noVncClient.addEventListener("securityfailure", (ev) => {
        errorMessage = ev.detail.reason;
        isLoggedIn = false;
      });

      noVncClient.addEventListener("connect", () => {
        isLoggedIn = true;
      });
      noVncClient.addEventListener("disconnect", () => {
        isLoggedIn = false;
      });

      noVncClient.addEventListener("credentialsrequired", (ev) => {
        console.warn(ev);
      });
    } catch (err) {
      console.error(err);
      errorMessage =
        err instanceof Error
          ? err.toString()
          : typeof err === "string"
            ? err
            : JSON.stringify(err, null, 2);
    } finally {
      isLoading = false;
      password = "";
    }
  }
</script>

{#if !isLoggedIn}
  <form
    class="px-6 py-4 [&>div]:space-y-2 space-y-6 w-full max-w-96 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border bg-background"
    onsubmit={async (ev) => {
      ev.preventDefault();
      await onLogin();
    }}
  >
    <div>
      <Button
        onclick={() => {
          let url = new URL(window.location.href);
          url.search = "";
          url.hash = "#/";
          window.appRouter.goto(url);
        }}
        variant="link"
        class="text-muted-foreground gap-1 text-xs px-0"
      >
        <ArrowLeft class="!h-3 !w-3" />
        Back
      </Button>
      <h3 class="scroll-m-20 text-2xl font-semibold tracking-tight">
        VNC Authentication
      </h3>
      <p class="text-muted-foreground">
        A username and/or password may be required, depending on the VNC server
        configuration.
      </p>
    </div>

    {#if typeof errorMessage !== "undefined"}
      <div>
        <Alert.Root variant="destructive">
          <TriangleAlert class="size-4" />
          <Alert.Title>Session Error</Alert.Title>
          <Alert.Description>{errorMessage}</Alert.Description>
        </Alert.Root>
      </div>
    {/if}

    <div
      class="grid items-center gap-x-2"
      style="grid-template-columns: 1fr 80px;"
    >
      <Label class="required">Host</Label>
      <Label class="!m-0">Port</Label>

      <Input placeholder="Hostname" required bind:value={hostname} />
      <Input placeholder="Port" type="number" required bind:value={port} />
    </div>

    <div>
      <Label>Username</Label>
      <Input bind:value={username} />
    </div>

    <div>
      <Label>Password</Label>
      <Input bind:value={password} type="password" />
    </div>

    <Button type="submit" class="w-full !mt-12" disabled={isLoading}>
      Connect
    </Button>
  </form>
{/if}

<div bind:this={el} class="h-full w-full" class:invisible={!isLoggedIn}></div>
