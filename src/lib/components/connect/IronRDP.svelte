<script lang="ts">
  import { mount, onMount, unmount } from "svelte";

  import ArrowLeft from "lucide-svelte/icons/arrow-left";

  import * as Alert from "$lib/components/ui/alert";
  import { Button } from "$lib/components/ui/button";
  import { Label } from "$lib/components/ui/label";
  import { Input } from "$lib/components/ui/input";

  import { IronErrorKind } from "$lib/components/ironrdp/interfaces/session-event";

  import {
    pkg,
    IronRdp,
    SessionEventType,
    type NewSessionInfo,
    type UserInteraction,
  } from "$lib/components/ironrdp";

  import { IpnRawTcpChannel } from "$lib/api/tsconnect";
  import { debounce } from "$lib/utils/misc";
  import TriangleAlert from "lucide-svelte/icons/triangle-alert";
  import { appConfig } from "$lib/store/config";
  import { get } from "svelte/store";

  interface Props {
    hostname: string;
    port?: number;
  }

  const { hostname: initialHostname, port: initialPort = 3389 }: Props =
    $props();

  let port = $state<number>(initialPort);
  let hostname = $state<string>(initialHostname);
  let username = $state<string>("");
  let password = $state<string>("");
  let serverDomain = $state<string>("");

  let userInteractionService = $state<UserInteraction>();
  let rawChannel = $state<IpnRawTcpChannel>();
  let session = $state<NewSessionInfo>();
  let componentMount = $state<object>();

  let isLoading = $state<boolean>(false);
  let isLoggedIn = $state<boolean>(false);
  let errorMessage = $state<unknown>();
  let errorType = $state<"Terminated" | "Error" | "Handler Error">();

  let el: HTMLDivElement;

  onMount(async () => {
    el.addEventListener("ready", async (ev) => {
      const { detail } = ev as IronRdpReadyEvent;

      userInteractionService = detail?.irgUserInteraction;

      userInteractionService.onSessionEvent((ev) => {
        const data =
          typeof ev.data === "string"
            ? { backtrace: ev.data }
            : { backtrace: ev.data.backtrace(), kind: ev.data.kind() };

        console.warn(
          `Session event: ${SessionEventType[ev.type]}\nkind: ${data.kind}\n${data.backtrace}`
        );

        switch (ev.type) {
          case SessionEventType.ERROR:
            errorType = "Error";
            errorMessage = data.backtrace;
            userInteractionService?.setVisibility(false);
            if (
              typeof data.kind === "number" &&
              data.kind === IronErrorKind.LogonFailure
            ) {
              errorMessage = "Invalid username or password";
            }
            break;
          case SessionEventType.STARTED:
            isLoggedIn = true;
            userInteractionService?.setVisibility(true);
            break;
          case SessionEventType.TERMINATED:
            errorType = "Terminated";
            errorMessage = data.backtrace;
            userInteractionService?.setVisibility(false);
            isLoggedIn = false;
            break;
          default:
            console.warn(`Unhandled session event: "${ev.type}"`, ev);
            break;
        }
      });
    });

    componentMount = mount(IronRdp, {
      target: el,
      props: {
        // TODO
        // @ts-expect-error
        module: pkg,
        debugwasm: get(appConfig).logLevel,
        verbose: "true",
        scale: "real",
        flexcenter: "true",
      },
    });
  });

  onMount(() => {
    window.addEventListener("beforeunload", beforeUnloadHandler);
    window.addEventListener("resize", resizeHandler);

    return () => {
      window.removeEventListener("beforeunload", beforeUnloadHandler);
      window.removeEventListener("resize", resizeHandler);

      userInteractionService?.shutdown();
      rawChannel?.close();
      if (typeof componentMount !== "undefined" && componentMount !== null) {
        unmount(componentMount);
      }
    };
  });

  const beforeUnloadHandler = (event: Event) => {
    if (!isLoggedIn) return;
    event.preventDefault(); // Recommended
    event.returnValue = true; // Included for legacy support, e.g. Chrome/Edge < 119
  };

  async function onLogin() {
    errorMessage = undefined;
    errorType = undefined;

    if (!userInteractionService) {
      throw new Error("UserInteractionService not yet ready!");
    }

    rawChannel = await IpnRawTcpChannel.connect({
      hostname,
      port,
    });

    session = await userInteractionService.connect({
      username,
      password,
      serverDomain,
      destination: rawChannel.remoteAddr,
      dataChannel: rawChannel,
      desktopSize: new DesktopSize(el.scrollWidth, el.scrollHeight),
      extensions: [],
    });

    password = "";
  }

  interface IronRdpReadyEvent extends Event {
    detail: {
      irgUserInteraction: UserInteraction;
    };
  }

  class DesktopSize {
    constructor(width: number, height: number) {
      this.height = height;
      this.width = width;
    }

    init(width: number, height: number): DesktopSize {
      return new DesktopSize(width, height);
    }

    height: number;
    width: number;
  }

  const resizeHandler = debounce(() => {
    const width = window.innerWidth >= 0 ? window.innerWidth : 0;
    const height = window.innerHeight >= 0 ? window.innerHeight : 0;
    userInteractionService?.resize(width, height);
  });
</script>

{#if !isLoggedIn}
  <form
    class="px-6 py-4 [&>div]:space-y-2 space-y-6 w-full max-w-96 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border bg-background"
    onsubmit={async (ev) => {
      ev.preventDefault();
      if (isLoading) return;
      isLoading = true;
      try {
        await onLogin();
      } catch (err) {
        console.error(err);
        errorType = "Handler Error";
        errorMessage =
          err instanceof Error
            ? err.toString()
            : typeof err === "string"
              ? err
              : JSON.stringify(err, null, 2);
      } finally {
        isLoading = false;
      }
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
        RDP Authentication
      </h3>
      <p class="text-muted-foreground">Connect to a node over native RDP</p>
    </div>

    {#if typeof errorMessage !== "undefined"}
      <div>
        <Alert.Root variant="destructive">
          <TriangleAlert class="size-4" />
          <Alert.Title>Session {errorType || "Error"}</Alert.Title>
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
      <Input required bind:value={username} />
    </div>

    <div>
      <Label>Password</Label>
      <Input required bind:value={password} type="password" />
    </div>

    <div>
      <Label>Domain</Label>
      <Input bind:value={serverDomain} />
    </div>

    <Button type="submit" class="w-full !mt-12" disabled={isLoading}>
      Connect
    </Button>
  </form>
{/if}

<div bind:this={el} class="h-full w-full"></div>
