<script lang="ts">
  import { Label } from "$lib/components/ui/label";
  import { Input } from "$lib/components/ui/input";
  import Button from "../ui/button/button.svelte";

  interface Props {
    onsubmit: (data: OnSubmitData) => void;
    hostname: string;
    port: number;
  }

  interface OnSubmitData {
    username: string;
    password: string;
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
</script>

<div class="h-full w-full grid place-items-center px-8">
  <form
    class="[&>div]:space-y-2 space-y-6 w-full max-w-96"
    onsubmit={(ev) => {
      ev.preventDefault();
      onsubmit({ username, password, hostname, port });
    }}
  >
    <div>
      <h3 class="scroll-m-20 text-2xl font-semibold tracking-tight">
        VNC Authentication
      </h3>
      <p class="text-muted-foreground">
        A username and/or password may be required, depending on the VNC server
        configuration.
      </p>
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
      <Input bind:value={username} />
    </div>

    <div>
      <Label>Password</Label>
      <Input bind:value={password} type="password" />
    </div>

    <Button type="submit" class="w-full !mt-12">Connect</Button>
  </form>
</div>
