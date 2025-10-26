<script lang="ts">
  import * as monaco from "monaco-editor";
  import { onMount } from "svelte";

  import AlertCircle from "lucide-svelte/icons/alert-circle";
  import Diff from "lucide-svelte/icons/diff";
  import Save from "lucide-svelte/icons/save";

  import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
  import * as Alert from "$lib/components/ui/alert";
  import { Button } from "$lib/components/ui/button";
  import { Toggle } from "$lib/components/ui/toggle";

  import { MonacoEditor, MonacoDiffEditor } from "$lib/components/monaco";

  import { Policyservice } from "$lib/api/policyservice";
  import { policySchema } from "$lib/utils/policy.js";
  import { errorToast } from "$lib/utils/error";
  import { appConfig } from "$lib/store/config";

  import LoadingScreen from "../LoadingScreen.svelte";
  import Layout from "../Layout.svelte";

  let original = monaco.editor.createModel(String("{}"), "json");
  let modified = monaco.editor.createModel("{}", "json");

  let diffEditor = $state<monaco.editor.IStandaloneDiffEditor>();
  let editor = $state<monaco.editor.IStandaloneCodeEditor>();
  let loadPromise = $state<Promise<any>>();
  let loadError = $state<string | null>(null);
  let isSaveOpen = $state<boolean>(false);
  let isDiff = $state<boolean>(false);

  monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
    trailingCommas: "ignore",
    allowComments: true,
    schemas: [
      {
        uri: "",
        fileMatch: ["*"],
        schema: policySchema,
      },
    ],
  });

  async function loadPolicy() {
    loadPromise = Policyservice.getPolicy()
      .then((data) => {
        original.setValue(data.policy);
        modified.setValue(data.policy);
        // updatedAt = data.updatedAt;
      })
      .catch((err) => {
        console.error(err);
        loadError = err?.toString() || "Unknown error";
      });
  }

  async function savePolicy(policy: string) {
    Policyservice.setPolicy(policy).catch((err) => {
      console.error(err);
      errorToast("Failed to save Policy: " + err?.toString());
    });
  }

  onMount(() => {
    loadPolicy();
    return () => {
      editor?.setModel(null);
      diffEditor?.setModel(null);
      original.dispose();
      modified.dispose();
      editor?.dispose();
      diffEditor?.dispose();
    };
  });
</script>

<Layout>
  <div class="grid gap-x-3 items-baseline grid-cols-[1fr,auto]">
    <div class="space-y-1.5">
      <h3 class="scroll-m-20 text-2xl font-semibold tracking-tight">
        Access Control
      </h3>
      <p class="text-muted-foreground">
        Control access to your network by defining rules for users, groups, and
        devices.
      </p>
    </div>

    <div class="flex items-center gap-x-1.5 flex-col sm:flex-row">
      <Toggle
        size="sm"
        aria-label="diff"
        bind:pressed={isDiff}
        disabled={!$appConfig.policyserviceHostname || !!loadError}
      >
        <Diff />
      </Toggle>

      <AlertDialog.Root bind:open={isSaveOpen}>
        <AlertDialog.Trigger>
          {#snippet child({ props })}
            <Button
              {...props}
              disabled={!$appConfig.policyserviceHostname || !!loadError}
              size="sm"
              variant="ghost"
              aria-label="save"
            >
              <Save />
            </Button>
          {/snippet}
        </AlertDialog.Trigger>
        <AlertDialog.Content>
          <AlertDialog.Header>
            <AlertDialog.Title>Save Policy?</AlertDialog.Title>
            <AlertDialog.Description>
              This will immediately apply the new access rules to your network.
              Ensure the policy is correct, as misconfigured rules could block
              access between critical nodes.
            </AlertDialog.Description>
          </AlertDialog.Header>

          {@const errors = monaco.editor.getModelMarkers({ owner: "json" })}
          {#if errors.length > 0}
            <Alert.Root variant="destructive">
              <AlertCircle class="size-4" />
              <Alert.Title>Validation errors</Alert.Title>
              <Alert.Description>
                You can still try to save the policy
              </Alert.Description>
            </Alert.Root>

            <div class="basic-table max-h-[20vh] overflow-y-scroll">
              <table class="basic-table max-h-[30vh] overflow-y-scroll">
                <thead>
                  <tr class="text-muted-foreground">
                    <th>Line</th>
                    <th>Message</th>
                  </tr>
                </thead>

                <tbody>
                  {#each errors as error}
                    <tr
                      class="mb-2 last:mb-0"
                      class:text-opacity-70={error.severity === 4}
                      class:text-yellow-400={error.severity === 4}
                      class:text-destructive={error.severity === 8}
                    >
                      <td class="whitespace-nowrap">{error.startLineNumber}</td>
                      <td>{error.message}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {/if}

          <AlertDialog.Footer>
            <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
            <AlertDialog.Action
              onclick={() => {
                savePolicy(modified.getValue());
                isSaveOpen = false;
              }}
            >
              Continue
            </AlertDialog.Action>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </div>
  </div>

  {#if !$appConfig.policyserviceHostname}
    <section class="space-y-10">
      <Alert.Root variant="destructive">
        <AlertCircle class="size-5" />
        <Alert.Title>Policy-Service Unavailable</Alert.Title>
        <Alert.Description>
          <p>
            Policy-Service functionality is not enabled within the current
            configuration
          </p>
        </Alert.Description>
      </Alert.Root>
    </section>
  {:else if loadError}
    <section class="space-y-10">
      <Alert.Root variant="destructive">
        <AlertCircle class="size-5" />
        <Alert.Title>Failed to load Policy</Alert.Title>
        <Alert.Description>
          <p>{loadError}</p>
        </Alert.Description>
      </Alert.Root>
    </section>
  {:else}
    {#await loadPromise}
      <LoadingScreen />
    {:then}
      <section class="h-[max(1024px,calc(100vh-300px))]">
        {#if isDiff}
          <MonacoDiffEditor
            bind:editor={diffEditor}
            onready={(e) => e.setModel({ original, modified })}
            readonly={false}
          />
        {:else}
          <MonacoEditor bind:editor onready={(e) => e.setModel(modified)} />
        {/if}
      </section>
    {/await}
  {/if}
</Layout>
