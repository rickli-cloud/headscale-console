<script lang="ts">
  import { cn } from "$lib/utils/shadcn";
  import type { HTMLAttributes } from "svelte/elements";
  import Button from "../ui/button/button.svelte";

  interface Props extends HTMLAttributes<HTMLDivElement> {
    error: unknown;
  }

  const { error, ...restProps }: Props = $props();

  function fmtErr(err: unknown): string {
    if (err instanceof Error) {
      return err.toString();
    } else if (typeof err === "string") {
      return err;
    } else {
      return JSON.stringify(err, null, 2);
    }
  }
</script>

<div
  {...restProps}
  class={cn(
    "space-y-6 bg-destructive text-destructive-foreground p-16 min-h-screen",
    restProps.class
  )}
>
  <div class="max-w-screen-lg mx-auto">
    <h1 class="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
      Critical Error Occurred
    </h1>

    <pre
      class="leading-7 [&:not(:first-child)]:mt-6 whitespace-break-spaces overflow-hidden break-all"><code
        >{fmtErr(error)}</code
      ></pre>

    <br />

    <div class="flex items-center gap-1.5 justify-end">
      <Button
        class="!bg-transparent border-destructive-foreground text-destructive-foreground border"
        onclick={() => location.reload()}
      >
        Try Again
      </Button>
    </div>
  </div>
</div>
