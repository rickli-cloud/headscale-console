<script lang="ts">
  import { onMount } from "svelte";

  import SlidersHorizontal from "lucide-svelte/icons/sliders-horizontal";
  import AlertCircle from "lucide-svelte/icons/alert-circle";
  import Plus from "lucide-svelte/icons/plus";

  import * as Sheet from "$lib/components/ui/sheet";
  import * as Alert from "$lib/components/ui/alert";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";

  import AuthkeyTable from "$lib/components/data/authkeys/AuthkeyTable.svelte";
  import CreateAuthkey from "$lib/components/data/authkeys/CreateAuthkey.svelte";

  import { SelfService, type Preauthkey } from "$lib/api/self-service";
  import { selfserviceCap } from "$lib/store/selfservice";
  import { errorToast } from "$lib/utils/error";
  import { appConfig } from "$lib/store/config";
  import { netMap } from "$lib/store/ipn";

  import LoadingScreen from "../LoadingScreen.svelte";
  import Layout from "../Layout.svelte";

  let authkeys = $state<Preauthkey[]>();
  let loadPromise = $state<Promise<any>>();
  let loadError = $state<string | null>(null);
  let createAuthkeySheetOpen = $state<boolean>(false);

  onMount(() => {
    loadAuthkeys();
  });

  async function loadAuthkeys() {
    loadPromise = SelfService.getAuthkeys()
      .then((result) => (authkeys = result))
      .catch((err) => {
        console.error(err);
        loadError = err?.toString() || "Unknown error";
      });
  }
</script>

<Layout>
  <section class="space-y-1.5">
    <h3 class="scroll-m-20 text-2xl font-semibold tracking-tight">Authkeys</h3>
    <p class="text-muted-foreground">
      Authkeys let you register new nodes without needing to sign in using a web
      browser
    </p>
  </section>

  {#if !$appConfig.selfserviceHostname}
    <section class="space-y-10">
      <Alert.Root variant="destructive">
        <AlertCircle class="size-5" />
        <Alert.Title>Self-Service Unavailable</Alert.Title>
        <Alert.Description>
          <p>
            Self-Service functionality is not enabled within the current
            configuration
          </p>
        </Alert.Description>
      </Alert.Root>
    </section>
  {:else if !$netMap?.peers.find((i) => i.name.split(".")[0] === $appConfig.selfserviceHostname)}
    <Alert.Root variant="destructive">
      <AlertCircle class="size-5" />
      <Alert.Title>Self-Service Unavailable</Alert.Title>
      <Alert.Description>
        <p>
          Machine "{$appConfig.selfserviceHostname}" does not exist or access is
          forbidden
        </p>
      </Alert.Description>
    </Alert.Root>
  {:else if !$netMap?.peers.find((i) => i.name.split(".")[0] === $appConfig.selfserviceHostname)?.online}
    <Alert.Root variant="destructive">
      <AlertCircle class="size-5" />
      <Alert.Title>Self-Service Unavailable</Alert.Title>
      <Alert.Description>
        <p>
          Machine "{$appConfig.selfserviceHostname}" is offline
        </p>
      </Alert.Description>
    </Alert.Root>
  {:else if loadError}
    <section class="space-y-10">
      <Alert.Root variant="destructive">
        <AlertCircle class="size-5" />
        <Alert.Title>Failed to load Authkeys</Alert.Title>
        <Alert.Description>
          <p>{loadError}</p>
        </Alert.Description>
      </Alert.Root>
    </section>
  {:else}
    {#await loadPromise}
      <LoadingScreen />
    {:then}
      <section class="space-y-10">
        <div class="flex items-center gap-1.5">
          <Button variant="outline" disabled>
            <SlidersHorizontal />
          </Button>

          <Input placeholder="search" class="min-w-24 max-w-[812px]" disabled />

          <Sheet.Root
            bind:open={createAuthkeySheetOpen}
            onOpenChange={(isOpen) => {
              if (!isOpen) loadAuthkeys();
            }}
          >
            <Sheet.Trigger>
              {#snippet child({ props })}
                <Button
                  {...props}
                  class="ml-auto"
                  disabled={!$selfserviceCap?.authkeys}
                >
                  <Plus />
                  Create
                </Button>
              {/snippet}
            </Sheet.Trigger>

            <Sheet.Content class="space-y-6">
              <Sheet.Header>
                <Sheet.Title>Create Authkey</Sheet.Title>
                <Sheet.Description>
                  Machines using this key will be automatically linked to your
                  user account
                </Sheet.Description>
              </Sheet.Header>

              <CreateAuthkey
                onsubmit={() => {
                  createAuthkeySheetOpen = false;
                }}
              />
            </Sheet.Content>
          </Sheet.Root>
        </div>

        <AuthkeyTable {authkeys} reload={loadAuthkeys} />
      </section>
    {/await}
  {/if}
</Layout>
