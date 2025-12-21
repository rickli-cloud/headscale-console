<script lang="ts">
  import { onMount } from "svelte";

  import ExternalLink from "lucide-svelte/icons/external-link";
  import Plus from "lucide-svelte/icons/plus";

  import Button from "$lib/components/ui/button/button.svelte";

  import Spinner from "$lib/components/utils/Spinner.svelte";
  import { QrCode } from "$lib/components/qrcode";

  import { IpnStateStorage } from "$lib/store/ipn";
  import { type Ipn } from "$lib/types/ipn";
  import { Hex } from "$lib/utils/misc";

  const {} = $props();

  let url = $state<string>();
  let profiles = $state<Ipn.Profiles>();

  window.ipnEventHandler.addEventListener(
    window.ipnEventHandler.Events.browseToURL,
    (ev) => {
      console.info("BrowseToUrl", ev.detail.url);
      url = ev.detail.url;
    }
  );

  onMount(() => {
    profiles = JSON.parse(Hex.decode(IpnStateStorage.getState("_profiles")));
  });
</script>

<div class="min-w-screen min-h-screen grid place-items-center">
  <main
    class="h-auto min-h-0 w-full max-w-screen-sm xl:max-w-screen-xl xl:grid xl:grid-cols-[2fr,1px,1fr] gap-8 items-center py-12 px-8"
  >
    <div class="w-full space-y-3 order-3">
      <h1
        class="scroll-m-20 text-4xl font-extrabold tracking-tight sm:text-6xl w-full"
      >
        Authenticate
      </h1>
      {#if !Object.keys(profiles || {}).length || url}
        <p class="text-muted-foreground">
          Scan the QR code or open the link to authenticate. Keep this page open
          while authenticating. Authkeys and tags can be passed through using
          the appropriate URL parameters.
        </p>

        <div class="!my-6">
          <Button
            href={url}
            target="_blank"
            variant="ghost"
            class="w-full text-left justify-start"
          >
            <ExternalLink />
            Open Link
          </Button>
        </div>
      {:else}
        <p class="text-muted-foreground">
          Add a new account or choose an existing session to continue.
          <!-- Continue an existing session or start a new one -->
        </p>

        <div class="!my-6">
          <Button
            variant="ghost"
            class="w-full text-left justify-start"
            onclick={() => window.ipn.login()}
          >
            <Plus />
            Add Account
          </Button>
        </div>
      {/if}
    </div>

    <hr class="xl:hidden" />
    <div class="w-1px border-l h-full order-2 hidden xl:block"></div>

    <div class="w-full mt-10 xl:mt-0 order-1 grid grid-cols-1">
      {#if url}
        <QrCode content={url} />
      {:else if !Object.keys(profiles || {}).length}
        <Spinner class="size-16 my-64 xl:my-auto place-self-center" />
      {:else}
        <div class="empty:hidden w-full">
          {#if profiles}
            {#each Object.entries(profiles) as [profileId, profile]}
              <div class="py-1.5 first:pt-0 last:pb-0 border-b last:border-b-0">
                <button
                  class="py-1.5 px-3 hover:bg-muted/40 w-full text-left xl:text-right"
                  onclick={() => window.ipn.switchProfile(profileId)}
                >
                  <h2 class="font-semibold text-lg">
                    {profile.Name}
                  </h2>
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
      {/if}
    </div>
  </main>
</div>
