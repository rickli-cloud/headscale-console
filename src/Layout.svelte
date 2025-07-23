<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import { onMount, type Snippet } from "svelte";

  import { Button } from "$lib/components/ui/button";

  import UserMenu from "$lib/components/data/user/UserMenu.svelte";

  import { netMap } from "$lib/store/ipn";
  import { cn } from "$lib/utils/shadcn";

  import { default as routes } from "$routes";
  import { selfserviceCap } from "$lib/store/selfservice";

  interface Props extends HTMLAttributes<HTMLElement> {
    children?: Snippet;
  }

  const { children, ...restProps }: Props = $props();

  onMount(() => {
    document.body.classList.remove("overflow-hidden");
  });
</script>

<header
  class="bg-muted w-full pt-4 space-y-6 [&>*]:!max-w-screen-xl [&>*]:!mx-auto"
>
  <div class="flex items-center gap-6 justify-between px-6 2xl:px-0">
    <h1 class="text-2xl font-extrabold tracking-tight text-foreground">
      {$netMap?.domain}
    </h1>

    <div>
      <UserMenu />
    </div>
  </div>

  <nav
    class="flex items-center overflow-x-scroll scrolltrack-hidden px-6 2xl:px-0"
  >
    {#key $selfserviceCap}
      {#each routes.filter((i) => !i?.isHidden?.()) as route}
        <Button
          href={route.href}
          onclick={window.appRouter.anchorOnclickHandler()}
          variant="ghost"
          class={cn(
            "rounded-none flex gap-1.5 items-center pb-4 px-3 select-none border-b border-transparent hover:border-muted-foreground",
            route.path.test(window.appRouter.currentPath)
              ? "!border-current border-b"
              : "text-muted-foreground"
          )}
        >
          <route.icon class="size-[14px]" />
          <span class="font-semibold">{route.name}</span>
        </Button>
      {/each}
    {/key}
  </nav>
</header>

<main
  {...restProps}
  class={cn(
    "h-full py-10 px-6 sm:px-8 [&>*]:!max-w-screen-xl [&>*]:!mx-auto space-y-12",
    restProps.class
  )}
>
  {@render children?.()}
</main>
