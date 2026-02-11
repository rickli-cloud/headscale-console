<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import { onMount, type Snippet } from "svelte";

  import { Button } from "$lib/components/ui/button";

  import UserMenu from "$lib/components/data/user/UserMenu.svelte";

  import { netMap } from "$lib/store/ipn";
  import { cn } from "$lib/utils/shadcn";

  import { default as routes } from "$routes";

  interface Props extends HTMLAttributes<HTMLElement> {
    children?: Snippet;
  }

  const { children, ...restProps }: Props = $props();

  onMount(() => {
    document.body.classList.remove("overflow-hidden");
  });
</script>

<header class="bg-muted w-full py-4 *:max-w-7xl *:mx-auto">
  <div class="flex items-center gap-6 justify-between px-6 2xl:px-0">
    <h1 class="text-2xl font-extrabold tracking-tight text-foreground">
      {$netMap?.domain}
    </h1>

    <div>
      <UserMenu />
    </div>
  </div>
</header>

<div class="bg-muted w-full *:max-w-7xl *:mx-auto sticky top-0 z-50 pt-2">
  <nav
    class="flex items-center overflow-x-scroll scrolltrack-hidden px-6 2xl:px-0"
  >
    {#each routes.filter((i) => !i?.isHidden?.()) as route}
      <Button
        href={route.href}
        onclick={window.appRouter.anchorOnclickHandler()}
        variant="ghost"
        class={cn(
          "rounded-none flex gap-1.5 items-center pb-4 px-3 select-none border-b border-transparent hover:border-muted-foreground",
          route.path.test(window.appRouter.currentPath)
            ? "border-current! border-b"
            : "text-muted-foreground",
        )}
      >
        <route.icon class="size-3.5" />
        <span class="font-semibold">{route.name}</span>
      </Button>
    {/each}
  </nav>
</div>

<main
  {...restProps}
  class={cn(
    "h-full py-10 px-6 sm:px-8 *:max-w-7xl *:mx-auto space-y-12 min-h-[calc(100svh-36px)]",
    restProps.class,
  )}
>
  {@render children?.()}
</main>
