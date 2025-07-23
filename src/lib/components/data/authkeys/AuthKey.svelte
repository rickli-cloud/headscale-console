<script lang="ts">
  import CopyCheck from "@lucide/svelte/icons/copy-check";
  import TimerOff from "@lucide/svelte/icons/timer-off";
  import Copy from "@lucide/svelte/icons/copy";

  import * as Dialog from "$lib/components/ui/dialog";
  import { Badge } from "$lib/components/ui/badge";

  import Time from "$lib/components/utils/Time.svelte";

  import { SelfService, type Preauthkey } from "$lib/api/self-service";
  import Button from "$lib/components/ui/button/button.svelte";
  import ConfirmAction from "../../utils/ConfirmAction.svelte";

  interface Props {
    authkey: Preauthkey;
    onupdate?: () => void;
  }

  const { authkey, onupdate }: Props = $props();

  let isCopied = $state<boolean>();
  let isExpired = $derived(
    Number.isNaN(Date.parse(authkey.expiration))
      ? null
      : Date.parse(authkey.expiration) < Date.now()
  );
  let expireAuthkey = $state<ConfirmAction>();

  async function copy() {
    isCopied = true;
    await navigator?.clipboard?.writeText?.(authkey.key);
    setTimeout(() => (isCopied = false), 1000);
  }
</script>

<Dialog.Root>
  <Dialog.Trigger>
    {#snippet child({ props })}
      {@const expiration = Date.parse(authkey.expiration)}

      <div {...props} class="cursor-pointer hover:bg-muted space-y-2 px-3 p-4">
        <p class="break-all overflow-hidden text-sm w-full text-center">
          {`${authkey.key.slice(0, 4)}${authkey.key.slice(4, authkey.key.length - 4).replaceAll(/\S/gm, "*")}${authkey.key.slice(authkey.key.length - 4, authkey.key.length)}`}
        </p>

        <div class="empty:hidden flex gap-1.5 items-center flex-wrap">
          {#if authkey.ephemeral}
            <Badge variant="outline">Ephemeral</Badge>
          {/if}

          {#if authkey.reusable}
            <Badge variant="outline">Reusable</Badge>
          {/if}

          {#each authkey.tags || [] as tag}
            <Badge variant="secondary">{tag}</Badge>
          {/each}
        </div>

        <div class="flex items-center gap-1.5 justify-between">
          <p class="text-sm text-muted-foreground">
            {new Date(authkey.createdAt).toLocaleString()}
          </p>

          <div>
            {#if !Number.isNaN(expiration)}
              {#if isExpired}
                <Badge variant="destructive">Expired</Badge>
              {:else if authkey.used && !authkey.reusable}
                <Badge variant="warning">Used</Badge>
              {:else}
                <Badge variant="positive">
                  Valid for <Time update={() => expiration - Date.now()} />
                </Badge>
              {/if}
            {/if}
          </div>
        </div>
      </div>
    {/snippet}
  </Dialog.Trigger>

  <Dialog.Content class="gap-6">
    <Dialog.Header>
      <Dialog.Title>Authkey</Dialog.Title>
      <Dialog.Description>
        Store this securely and never share it with anyone you don't fully
        trust!
      </Dialog.Description>
    </Dialog.Header>

    <div
      class="grid grid-cols-[auto,1fr] items-center border rounded px-3 gap-1.5 w-full"
    >
      <button onclick={copy}>
        {#if isCopied}
          <CopyCheck class="h-4 w-4" />
        {:else}
          <Copy class="h-4 w-4" />
        {/if}
      </button>
      <p class="break-all overflow-hidden py-3 text-center font-semibold">
        {authkey.key}
      </p>
    </div>

    <div class="grid grid-cols-2 gap-4 px-2 [&>div]:space-y-1">
      <div>
        <p class="font-semibold">Created</p>
        <p class="text-muted-foreground">
          {new Date(authkey.createdAt).toLocaleString()}
        </p>
      </div>

      <div>
        <p class="font-semibold">Expires</p>
        <p class="text-muted-foreground">
          {new Date(authkey.expiration).toLocaleString()}
        </p>
      </div>

      <div>
        <p class="font-semibold">ID</p>
        <p class="text-muted-foreground">
          {authkey.id?.length ? "#" + authkey.id : "unknown"}
        </p>
      </div>

      <div>
        <p class="font-semibold">Used</p>
        <p class="text-muted-foreground">{authkey.used ?? "unknown"}</p>
      </div>

      <div>
        <p class="font-semibold">Ephemeral</p>
        <p class="text-muted-foreground">{authkey.ephemeral ?? "unknown"}</p>
      </div>

      <div>
        <p class="font-semibold">Reusable</p>
        <p class="text-muted-foreground">{authkey.reusable ?? "unknown"}</p>
      </div>

      <div class="col-span-2">
        <p class="font-semibold">Tags</p>
        {#if authkey.tags?.length}
          <div class="flex items-center gap-1.5 flex-wrap !mt-2">
            {#each authkey.tags as tag}
              <Badge variant="secondary">{tag.replace(/^tag:/, "")}</Badge>
            {/each}
          </div>
        {:else}
          <p class="text-muted-foreground">none</p>
        {/if}
      </div>
    </div>

    <div class="flex items-center justify-end gap-1.5">
      <Button
        variant="destructive"
        disabled={!authkey.id?.length || isExpired}
        onclick={() => expireAuthkey?.open()}
      >
        <TimerOff />
        Expire
      </Button>
    </div>
  </Dialog.Content>
</Dialog.Root>

<ConfirmAction
  bind:this={expireAuthkey}
  action={() => {
    SelfService.expireAuthkey(authkey.key).then(() => {
      expireAuthkey?.close();
      onupdate?.();
    });
  }}
/>
