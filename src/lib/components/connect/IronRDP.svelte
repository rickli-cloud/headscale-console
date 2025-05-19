<script lang="ts">
  import { mount, onMount, unmount } from "svelte";

  import { Button } from "$lib/components/ui/button";
  import { Label } from "$lib/components/ui/label";
  import { Input } from "$lib/components/ui/input";

  import {
    pkg,
    IronRdp,
    SessionEventType,
    type NewSessionInfo,
    type UserInteraction,
  } from "$lib/components/ironrdp";

  import { IpnRawTcpChannel } from "$lib/api/tsconnect";
  import { debounce } from "$lib/utils/misc";

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

  let isLoading = $state<boolean>(false);
  let isLoggedIn = $state<boolean>(false);
  let userInteractionService = $state<UserInteraction | undefined>();
  let rawChannel = $state<IpnRawTcpChannel | undefined>();
  let session = $state<NewSessionInfo | undefined>();
  let componentMount = $state();

  let el: HTMLDivElement;

  onMount(async () => {
    el.addEventListener("ready", async (ev) => {
      const { detail } = ev as IronRdpReadyEvent;

      userInteractionService = detail?.irgUserInteraction;

      userInteractionService.onSessionEvent((ev) =>
        console.warn(
          `Session event: ${SessionEventType[ev.type]}\n${
            typeof ev.data === "string"
              ? ev.data
              : JSON.stringify(
                  { backtrace: ev.data.backtrace(), kind: ev.data.kind() },
                  null,
                  2
                )
          }`
        )
      );
    });

    componentMount = mount(IronRdp, {
      target: el,
      props: {
        // TODO
        // @ts-expect-error
        module: pkg,
        debugwasm: import.meta.env.PROD ? "INFO" : "DEBUG",
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
      if (componentMount) unmount(componentMount);
    };
  });

  const beforeUnloadHandler = (event: Event) => {
    if (!isLoggedIn) return;
    event.preventDefault(); // Recommended
    event.returnValue = true; // Included for legacy support, e.g. Chrome/Edge < 119
  };

  async function onLogin() {
    if (!userInteractionService) return;

    rawChannel = await IpnRawTcpChannel.connect({
      hostname,
      port,
    }).catch((e) => {
      throw `Failed to connect: ` + e;
    });

    console.debug({ rawChannel });

    session = await userInteractionService.connect({
      username,
      password,
      serverDomain,
      destination: rawChannel.remoteAddr,
      dataChannel: rawChannel,
      desktopSize: new DesktopSize(el.scrollWidth, el.scrollHeight),
      extensions: [],
    });

    userInteractionService.setVisibility(true);

    isLoggedIn = true;
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
    console.debug("resize", { width, height });
    userInteractionService?.resize(width, height);
  });
</script>

{#if !isLoggedIn}
  <form
    class="px-6 py-4 [&>div]:space-y-2 space-y-6 w-full max-w-96 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border bg-background"
    onsubmit={(ev) => {
      ev.preventDefault();
      isLoading = true;
      onLogin().then(() => (isLoading = false));
    }}
  >
    <div>
      <h3 class="scroll-m-20 text-2xl font-semibold tracking-tight">
        RDP Authentication
      </h3>
      <p class="text-muted-foreground">Connect to a node over native RDP</p>
    </div>

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

    <Button type="submit" class="w-full !mt-12">Connect</Button>
  </form>
{/if}

<div bind:this={el} class="h-full w-full"></div>
