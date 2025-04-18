<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Label } from "$lib/components/ui/label";
  import { Input } from "$lib/components/ui/input";

  interface Props {
    onsubmit: (data: OnSubmitData) => void;
    hostname: string;
    port: number;
  }

  interface OnSubmitData {
    username: string;
    password: string;
    serverDomain: string;
    hostname: string;
    port: number;
  }

  let {
    onsubmit,
    hostname = $bindable(),
    port = $bindable(),
  }: Props = $props();

  let username = $state<string>("");
  let password = $state<string>("");
  let serverDomain = $state<string>("");
</script>

<form
  class="px-6 py-4 [&>div]:space-y-2 space-y-6 w-full max-w-96 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
  onsubmit={(ev) => {
    ev.preventDefault();
    onsubmit({ username, password, hostname, port, serverDomain });
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
    <Label>Host</Label>
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
