<script lang="ts">
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
  import { Input } from "$lib/components/ui/input";

  import { netMap } from "$lib/store/ipn";

  interface Props {
    hostname: string;
    filter?: () => boolean;
    required?: boolean;
  }

  let {
    hostname = $bindable(""),
    filter = () => true,
    required = true,
  }: Props = $props();

  let peers = $derived(
    ($netMap?.peers || [])
      .filter((i) => i.online && !i.expired)
      .filter(
        (i) =>
          !hostname.length ||
          new RegExp(hostname).test(i.name.split(".")[0]) ||
          i.addresses.find((i) => new RegExp(hostname).test(i))?.length
      )
      .filter(filter)
  );
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    {#snippet child({ props: { type: _, ...props } })}
      <Input {...props} {required} bind:value={hostname} />
    {/snippet}
  </DropdownMenu.Trigger>

  <DropdownMenu.Content
    onOpenAutoFocus={(e) => e.preventDefault()}
    onCloseAutoFocus={(e) => e.preventDefault()}
    align="start"
    class="min-w-[262px]"
  >
    {#if peers.length}
      <DropdownMenu.Group>
        {#each peers as peer}
          {@const name = peer.name.split(".")[0]}
          <DropdownMenu.Item class="flex-col items-start">
            <button
              class="h-full w-full text-left space-y-1.5"
              onclick={() => (hostname = name)}
            >
              <p>
                {name}
              </p>
              <p class="text-xs text-muted-foreground">
                {peer.addresses.join(", ")}
              </p>
            </button>
          </DropdownMenu.Item>
        {/each}
      </DropdownMenu.Group>
    {/if}
  </DropdownMenu.Content>
</DropdownMenu.Root>
