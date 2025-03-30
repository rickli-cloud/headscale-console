<script lang="ts">
  import { createDockview, type DockviewApi } from "dockview-core";
  import { type HTMLAttributes } from "svelte/elements";
  import { mode } from "mode-watcher";
  import { onMount } from "svelte";

  import { cn } from "$lib/utils/shadcn";

  import { createComponent } from "./index";

  interface Props extends HTMLAttributes<HTMLDivElement> {
    ready?: (dockView: DockviewApi) => void;
  }

  let { ready, ...restProps }: Props = $props();

  let windowEl: HTMLDivElement;
  let sidebarEl: HTMLElement | null;

  function resize(data: { navWidth: number }) {
    if (!sidebarEl || !windowEl) return;
    const refEl = document.getElementById("#app") || document.body;
    windowEl.style.width = `${refEl.offsetWidth - data.navWidth}px`;
    windowEl.style.height = `${refEl.offsetHeight}px`;
  }

  const sidebarObserver = new ResizeObserver((ev) => {
    resize({ navWidth: ev[0].contentRect.width });
  });

  const bodyObserver = new ResizeObserver(() => {
    resize({ navWidth: sidebarEl?.offsetWidth ?? 0 });
  });

  function pollSidebarEl(timeout: number = 10000): Promise<HTMLElement> {
    const el = document.getElementById("app-sidebar");
    return el
      ? Promise.resolve(el)
      : new Promise((resolve) =>
          setTimeout(() => resolve(pollSidebarEl(timeout)), timeout)
        );
  }

  onMount(async () => {
    sidebarEl = document.getElementById("app-sidebar");
    if (sidebarEl) sidebarObserver.observe(sidebarEl);
    else {
      pollSidebarEl().then((el) => {
        sidebarEl = el;
        sidebarObserver.observe(sidebarEl);
      });
    }

    bodyObserver.observe(document.getElementById("#app") || document.body);

    if (!windowEl) throw new Error("windowEl is undefined");

    window.dockView = createDockview(windowEl, {
      createComponent,
      className:
        $mode === "dark" ? "dockview-theme-dark" : "dockview-theme-light",
    });

    ready?.(window.dockView);
  });
</script>

<div
  {...restProps}
  bind:this={windowEl}
  class={cn("h-full w-full", restProps.class)}
></div>
