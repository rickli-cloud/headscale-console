<script lang="ts">
  import { cn } from "$lib/utils/shadcn";
  import LoaderCircle from "lucide-svelte/icons/loader-circle";
  import type { ComponentProps } from "svelte";

  interface Props extends ComponentProps<LoaderCircle> {}

  const { ...restProps }: Props = $props();
</script>

<LoaderCircle {...restProps} class={cn("animate-spin", restProps.class)} />
