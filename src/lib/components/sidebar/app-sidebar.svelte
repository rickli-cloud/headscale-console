<script lang="ts">
  import { type ComponentProps } from "svelte";

  import PanelLeft from "lucide-svelte/icons/panel-left";
  import Server from "lucide-svelte/icons/server";
  import Cog from "lucide-svelte/icons/cog";

  import * as Collapsible from "$lib/components/ui/collapsible";
  import * as Sidebar from "$lib/components/ui/sidebar";
  import { useSidebar } from "$lib/components/ui/sidebar";

  import { cn } from "$lib/utils/shadcn";

  import NavUser from "./nav-user.svelte";
  import ChevronRight from "lucide-svelte/icons/chevron-right";
  import NodeMap from "../data/node/NodeMap.svelte";

  interface Props extends ComponentProps<typeof Sidebar.Root> {}

  let { ref = $bindable(null), ...restProps }: Props = $props();

  const sidebar = useSidebar();
</script>

<Sidebar.Root
  bind:ref
  collapsible="icon"
  side="right"
  {...restProps}
  class={cn(
    "overflow-hidden [&>[data-sidebar=sidebar]]:flex-row-reverse",
    restProps.class
  )}
>
  <Sidebar.Root
    collapsible="none"
    class="!w-[calc(var(--sidebar-width-icon)_+_1px)] border-l hidden md:flex"
    side="right"
  >
    <div class="h-2.5 md:h-0.5"></div>

    <Sidebar.Header>
      <Sidebar.Menu>
        <Sidebar.MenuItem>
          <Sidebar.MenuButton
            size="lg"
            class="md:h-8 md:p-0"
            onclick={() => {
              sidebar.toggle();
            }}
          >
            {#snippet child({ props })}
              <a {...props} class="cursor-pointer">
                <div
                  class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
                >
                  <PanelLeft class="size-4" />
                </div>
                <div class="grid flex-1 text-left text-sm leading-tight">
                  <span class="truncate font-semibold"></span>
                  <span class="truncate text-xs"></span>
                </div>
              </a>
            {/snippet}
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>
      </Sidebar.Menu>
    </Sidebar.Header>

    <Sidebar.Content>
      <Sidebar.Group class="py-1">
        <Sidebar.GroupContent class="px-1.5 md:px-0">
          <Sidebar.Menu class="gap-1.5">
            <Sidebar.MenuItem>
              <Sidebar.MenuButton
                tooltipContentProps={{
                  hidden: false,
                }}
                onclick={() => sidebar.toggle()}
                isActive={true}
                class="px-2.5 md:px-2"
              >
                {#snippet tooltipContent()}
                  Nodes
                {/snippet}
                <Server />
                <span>Nodes</span>
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>

            <!-- <Sidebar.MenuItem>
              <Sidebar.MenuButton
                tooltipContentProps={{
                  hidden: false,
                }}
                onclick={() => {
                  if (activeItem === "sessions") sidebar.toggle();
                  else {
                    activeItem = "sessions";
                    sidebar.setOpen(true);
                  }
                }}
                isActive={activeItem === "sessions"}
                class="px-2.5 md:px-2"
              >
                {#snippet tooltipContent()}
                  Sessions
                {/snippet}
                <Terminal />
                <span>Sessions</span>
              </Sidebar.MenuButton>
            </Sidebar.MenuItem> -->

            <Sidebar.MenuItem>
              <Sidebar.MenuButton
                tooltipContentProps={{
                  hidden: false,
                }}
                onclick={() => {}}
                isActive={false}
                class="px-2.5 md:px-2"
                aria-disabled={true}
              >
                {#snippet tooltipContent()}
                  Settings
                {/snippet}
                <Cog />
                <span>Settings</span>
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>
          </Sidebar.Menu>
        </Sidebar.GroupContent>
      </Sidebar.Group>
    </Sidebar.Content>
    <Sidebar.Footer>
      <NavUser />
    </Sidebar.Footer>
  </Sidebar.Root>

  <Sidebar.Root
    collapsible="none"
    class="flex-1 flex md:w-[calc(var(--sidebar-width)-49px)]"
  >
    <!-- <Sidebar.Header class="gap-3.5 border-b p-4">
      <div class="flex w-full items-center justify-between">
        <div class="text-foreground text-base font-medium capitalize">
          {activeItem}
        </div>

        <-- <Label class="flex items-center gap-2 text-sm">
          <span>Unreads</span>
          <Switch class="shadow-none" />
        </Label> --
      </div>

      <-- <Sidebar.Input placeholder="Type to search..." /> --
    </Sidebar.Header> -->

    <Sidebar.Content>
      <Sidebar.Group class="px-0">
        <Collapsible.Root open class="group/collapsible">
          <Sidebar.GroupLabel
            class="group/label text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-[calc(100%-1rem)] text-sm mx-2"
          >
            {#snippet child({ props })}
              <Collapsible.Trigger {...props}>
                <span class="font-semibold"> Nodes </span>
                <ChevronRight
                  class="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90"
                />
              </Collapsible.Trigger>
            {/snippet}
          </Sidebar.GroupLabel>

          <Collapsible.Content>
            <Sidebar.GroupContent>
              <NodeMap />
            </Sidebar.GroupContent>
          </Collapsible.Content>
        </Collapsible.Root>
      </Sidebar.Group>

      <Sidebar.Group>
        <Sidebar.GroupContent class="overflow-hidden"></Sidebar.GroupContent>
      </Sidebar.Group>

      <Sidebar.Group class="mt-auto pt-4 md:hidden">
        <NavUser />
      </Sidebar.Group>
    </Sidebar.Content>
  </Sidebar.Root>
</Sidebar.Root>
