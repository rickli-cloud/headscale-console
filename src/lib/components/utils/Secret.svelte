<script lang="ts">
  import { writable } from "svelte/store";

  import EyeOff from "lucide-svelte/icons/eye-off";
  import Eye from "lucide-svelte/icons/eye";

  import { cn } from "$lib/utils/shadcn";

  import type { HTMLAttributes } from "svelte/elements";

  interface Props extends HTMLAttributes<HTMLDivElement> {
    secret: string | undefined;
  }

  const { secret, ...restProps }: Props = $props();

  const visible = writable<boolean>(false);
</script>

<div {...restProps} class={cn("flex h-5 items-center gap-2", restProps.class)}>
  <button onclick={() => visible.set(!$visible)}>
    {#if $visible}
      <EyeOff class="!h-4 w-4" />
    {:else}
      <Eye class="!h-4 w-4" />
    {/if}
  </button>

  {#if $visible}
    <span class="text-sm">
      {secret}
    </span>
  {:else}
    <span style="font-size: 1.125rem; line-height: 10px; padding-top: 6px;">
      {secret?.replaceAll(/./g, "*")}
    </span>
  {/if}
</div>
