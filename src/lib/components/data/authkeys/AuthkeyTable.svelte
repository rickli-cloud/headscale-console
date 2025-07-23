<script lang="ts">
  import AlertCircleIcon from "@lucide/svelte/icons/alert-circle";
  import CopyCheck from "@lucide/svelte/icons/copy-check";
  import Copy from "@lucide/svelte/icons/copy";

  import * as Dialog from "$lib/components/ui/dialog";
  import * as Alert from "$lib/components/ui/alert";
  import * as Table from "$lib/components/ui/table";
  import Badge from "$lib/components/ui/badge/badge.svelte";

  import ConfirmAction from "$lib/components/utils/ConfirmAction.svelte";
  import Time from "$lib/components/utils/Time.svelte";

  import { SelfService, type Preauthkey } from "$lib/api/self-service";
  import { errorToast } from "$lib/utils/error";

  interface Props {
    authkeys: Preauthkey[] | undefined;
    reload: () => void | Promise<void>;
  }

  const { authkeys = [], reload }: Props = $props();

  let confirmExpire = $state<{ [x: string]: ConfirmAction }>({});
  let keyDialogs = $state<{ [x: string]: boolean }>(
    Object.fromEntries(authkeys.map((i) => [i.key, false]))
  );
  let isCopied = $state<boolean>();

  async function copy(key: string) {
    await navigator?.clipboard?.writeText?.(key);
    isCopied = true;
    setTimeout(() => (isCopied = false), 1000);
  }

  async function expireKey(key: string) {
    try {
      await SelfService.expireAuthkey(key);
    } catch (err) {
      console.error("Failed to expire Authkey:", err);
      errorToast("Failed to expire Authkey: " + err?.toString());
    }
  }
</script>

<Table.Root>
  <Table.Header>
    <Table.Row>
      <Table.Head>Key</Table.Head>
      <Table.Head>Created</Table.Head>
      <Table.Head>Expires</Table.Head>
      <Table.Head></Table.Head>
      <Table.Head></Table.Head>
    </Table.Row>
  </Table.Header>

  <Table.Body>
    {#each authkeys as authkey}
      {@const isExpired = Date.now() > new Date(authkey.expiration).getTime()}

      <Table.Row class="cursor-pointer">
        <Table.Cell
          onclick={() => (keyDialogs[authkey.key] = true)}
          class="whitespace-nowrap select-none"
        >
          {authkey.key.slice(0, 3)}...{authkey.key.slice(
            authkey.key.length - 3,
            authkey.key.length
          )}
        </Table.Cell>

        <Table.Cell
          onclick={() => (keyDialogs[authkey.key] = true)}
          class="whitespace-nowrap select-none"
        >
          {new Date(authkey.createdAt).toLocaleString()}
        </Table.Cell>

        <Table.Cell
          onclick={() => (keyDialogs[authkey.key] = true)}
          class="whitespace-nowrap select-none"
        >
          {#if isExpired}
            {new Date(authkey.expiration).toLocaleString()}
          {:else}
            <Time
              update={() => Date.now() - new Date(authkey.expiration).getTime()}
            />
          {/if}
        </Table.Cell>

        <Table.Cell
          onclick={() => (keyDialogs[authkey.key] = true)}
          class="whitespace-nowrap select-none"
        >
          {#if isExpired}
            <Badge variant="destructive">expired</Badge>
          {/if}
          {#if authkey.used && !authkey.reusable}
            <Badge variant="destructive">used</Badge>
          {/if}
          {#if authkey.reusable}
            <Badge>reusable</Badge>
          {/if}
          {#if authkey.ephemeral}
            <Badge>ephemeral</Badge>
          {/if}
          {#each authkey.tags || [] as tag}
            <Badge variant="outline">{tag}</Badge>
          {/each}
        </Table.Cell>

        <Table.Cell class="whitespace-nowrap select-none">
          <button
            class="text-destructive hover:underline disabled:no-underline disabled:text-destructive/50"
            onclick={confirmExpire[authkey.key]?.open}
            disabled={isExpired}
          >
            Revoke
          </button>

          <ConfirmAction
            bind:this={confirmExpire[authkey.key]}
            action={() => expireKey(authkey.key).then(reload)}
          />
        </Table.Cell>
      </Table.Row>

      <Dialog.Root bind:open={keyDialogs[authkey.key]}>
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>Authkey</Dialog.Title>
            <Dialog.Description>
              Store this securely and never share it with anyone you don't fully
              trust!
            </Dialog.Description>
          </Dialog.Header>

          {#if isExpired}
            <Alert.Root variant="destructive">
              <AlertCircleIcon class="size-5" />
              <Alert.Title>Authkey expired</Alert.Title>
              <Alert.Description>
                <p>This key is no longer valid</p>
              </Alert.Description>
            </Alert.Root>
          {/if}

          <div
            class="grid grid-cols-[auto,1fr] items-center border rounded px-3 gap-1.5 w-full"
          >
            <button
              onclick={(ev) => {
                ev.stopPropagation();
                ev.preventDefault();
                copy(authkey.key);
              }}
            >
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
        </Dialog.Content>
      </Dialog.Root>
    {/each}
  </Table.Body>
</Table.Root>
