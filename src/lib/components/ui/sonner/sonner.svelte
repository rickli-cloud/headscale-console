<script lang="ts">
  import {
    Toaster as Sonner,
    type ToasterProps as SonnerProps,
  } from "svelte-sonner";
  import { mode } from "mode-watcher";
  import { buttonVariants } from "../button";
  import { cn } from "$lib/utils/shadcn";

  let { ...restProps }: SonnerProps = $props();
</script>

<Sonner
  theme={$mode}
  class="toaster group"
  toastOptions={{
    classes: {
      toast:
        "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
      description: "group-[.toast]:text-muted-foreground",
      actionButton: cn(
        buttonVariants.variants.variant.ghost,
        "h-auto px-2.5 py-1"
      ),
      cancelButton: cn(
        buttonVariants.variants.variant.ghost,
        "h-auto px-2.5 py-1"
      ),
    },
  }}
  {...restProps}
/>
