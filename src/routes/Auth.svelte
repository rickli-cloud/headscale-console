<script lang="ts">
  import ExternalLink from "lucide-svelte/icons/external-link";

  import Button from "$lib/components/ui/button/button.svelte";
  import Input from "$lib/components/ui/input/input.svelte";

  import { QrCode } from "$lib/components/qrcode";

  import { IpnStateStorage } from "$lib/store/ipn";
  import { type Ipn } from "$lib/types/ipn";
  import { Hex } from "$lib/utils/misc";
  import Plus from "lucide-svelte/icons/plus";

  const {} = $props();

  let url = $state<string | undefined>();
  let authkey = $state<string>();

  window.ipnEventHandler.addEventListener(
    window.ipnEventHandler.Events.browseToURL,
    (ev) => {
      console.info("BrowseToUrl", ev.detail.url);
      url = ev.detail.url;
    }
  );
</script>

<div class="w-screen min-h-screen grid place-items-center">
  <main
    class="h-auto min-h-0 w-full max-w-screen-sm flex items-center flex-col space-y-10 min-w-[max(256px,min(80vw,512px))] py-12 px-8"
  >
    {#if url}
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
          <ExternalLink />
          Open Link
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
    {:else}
      <div class="w-full space-y-2">
        <h1
          class="scroll-m-20 text-4xl font-extrabold tracking-tight sm:text-6xl w-full"
        >
          Authenticate
        </h1>
        <p class="text-muted-foreground">
          Continue an existing session or start a new one
        </p>
      </div>

      <div class="empty:hidden w-full">
        {#if IpnStateStorage.getState("_profiles")}
          {#each Object.entries(JSON.parse(Hex.decode(IpnStateStorage.getState("_profiles"))) as Ipn.Profiles) as [profileId, profile]}
            <div class="py-1.5 first:pt-0 last:pb-0 border-b last:border-b-0">
              <button
                class="py-1.5 px-3 hover:bg-muted/40 w-full text-left"
                onclick={() => window.ipn.switchProfile(profileId)}
              >
                <div class="flex gap-1.5 items-center">
                  <h2 class="font-semibold text-lg">
                    {profile.Name}
                  </h2>
                </div>
                <p class="text-muted-foreground">
                  {profile.NetworkProfile.MagicDNSName}
                </p>
                <p class="text-muted-foreground">
                  {profile.NetworkProfile.DomainName}
                </p>
                <div
                  class="mt-1.5 flex gap-1.5 items-center empty:hidden"
                ></div>
              </button>
            </div>
          {/each}
        {/if}
      </div>

      <Button
        variant="outline"
        class="w-full"
        onclick={() => window.ipn.login()}
      >
        <Plus />
        Add Account
      </Button>
    {/if}
  </main>
</div>
