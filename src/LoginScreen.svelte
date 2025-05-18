<script lang="ts">
  import ArrowRight from "lucide-svelte/icons/arrow-right";
  import ExternalLink from "lucide-svelte/icons/external-link";

  import Button from "$lib/components/ui/button/button.svelte";

  import { QrCode } from "$lib/components/qrcode";
  import Input from "$lib/components/ui/input/input.svelte";

  interface Props {
    url: string;
  }

  const { url }: Props = $props();

  let authkey = $state<string>();
</script>

<div class="w-screen min-h-screen grid place-items-center">
  <main
    class="h-auto min-h-0 w-full max-w-screen-sm flex items-center flex-col space-y-10 min-w-[max(256px,min(80vw,512px))] py-12 px-8"
  >
    <div class="w-full space-y-2">
      <h1
        class="scroll-m-20 text-4xl font-extrabold tracking-tight sm:text-6xl w-full"
      >
        Authenticate
      </h1>
      <p class="text-muted-foreground">
        This can be done in a new tab or on another device
      </p>
    </div>

    <QrCode content={url} />

    <div class="w-full space-y-3">
      <Button href={url} target="_blank" variant="outline" class="w-full">
        Open Link
        <ExternalLink />
      </Button>

      <form
        class="grid grid-cols-[1fr,92px] gap-[0.5px]"
        onsubmit={(ev) => {
          ev.preventDefault();
          if (!authkey?.length) return;

          const url = new URL(window.location.href);

          url.searchParams.set("k", authkey);
          url.hash = `#${window.appRouter.currentPath.length ? window.appRouter.currentPath : "/"}`;

          window.location.href = url.toString();

          console.warn({
            path: window.appRouter.currentPath,
            url,
          });
        }}
      >
        <Input
          required
          placeholder="Use Authkey"
          class="rounded-r-none"
          bind:value={authkey}
        />
        <Button
          variant="outline"
          type="submit"
          class="border-l-0 rounded-l-none"
        >
          Continue
        </Button>
      </form>
    </div>
  </main>
</div>
