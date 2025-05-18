<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";

  import Send from "lucide-svelte/icons/send";
  import X from "lucide-svelte/icons/x";

  import { Checkbox } from "$lib/components/ui/checkbox";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";

  import { SelfService } from "$lib/api/self-service";
  import { cn } from "$lib/utils/shadcn";

  import AuthKey from "./AuthKey.svelte";

  interface Props extends HTMLAttributes<HTMLFormElement> {
    /** Called to close the popup */
    onsubmit?: () => void;
    /** Called when a new key was created */
    onupdate?: () => void;
  }

  const { onsubmit: propsSubmit, onupdate, ...restProps }: Props = $props();

  let reusable = $state<boolean>(false);
  let ephemeral = $state<boolean>(false);
  let expiration = $state<string>("");

  let result =
    $state<Awaited<ReturnType<typeof SelfService.createAuthkey>>>(/* {
    key: "123ads6958376b983725cf465q95",
    exp: new Date(Date.now() + 80496223).toISOString(),
    id: "123",
  } */);

  async function onsubmit(ev: SubmitEvent) {
    ev.preventDefault();

    result = await SelfService.createAuthkey({
      reusable,
      ephemeral,
      expiration: new Date(expiration),
    });

    onupdate?.();
  }

  const oneMinute = 1000 * 60;

  function fmtDate(offset: number) {
    return new Date(
      Date.now() - new Date().getTimezoneOffset() * oneMinute + offset
    )
      .toISOString()
      .split(".")[0];
  }

  const minDate = fmtDate(oneMinute * 5);
  const maxDate = fmtDate(oneMinute * 60 * 24 * 31);
</script>

<form {...restProps} class={cn("space-y-6", restProps.class)} {onsubmit}>
  <div class="space-y-1.5">
    <Label for="create-authkey-exp">Expiration</Label>
    <Input
      id="create-authkey-exp"
      type="datetime-local"
      min={minDate}
      max={maxDate}
      step="any"
      required
      bind:value={expiration}
      disabled={!!result}
    />
  </div>

  <div class="flex items-center space-x-2">
    <Checkbox
      id="create-authkey-reusable"
      aria-labelledby="create-authkey-reusable"
      bind:checked={reusable}
      disabled={!!result}
    />
    <Label for="create-authkey-reusable">Reusable</Label>
  </div>

  <div class="flex items-center space-x-2">
    <Checkbox
      id="create-authkey-ephemeral"
      aria-labelledby="create-authkey-ephemeral"
      bind:checked={ephemeral}
      disabled={!!result}
    />
    <Label for="create-authkey-ephemeral">Ephemeral</Label>
  </div>

  <!-- <pre><code>{JSON.stringify({ exp, reusable, ephemeral }, null, 2)}</code></pre> -->

  <div class="flex items-center gap-1.5 justify-end">
    <Button type="submit" variant="outline" disabled={!!result}>
      <Send />
      Submit
    </Button>
  </div>
</form>

{#if result?.key}
  <hr />

  <div class="space-y-4">
    <p class="font-semibold">Your new Authkey</p>

    <AuthKey
      authkey={{
        reusable,
        ephemeral,
        id: result.id || "",
        key: result.key || "",
        expiration: result.exp || "",
        createdAt: new Date().toISOString(),
        used: false,
        tags: [],
      }}
      {onupdate}
    />
  </div>

  <div class="flex items-center justify-end gap-1.5 w-full">
    <Button type="button" variant="secondary" onclick={propsSubmit}>
      <X />
      Close
    </Button>
  </div>

  <!-- <pre><code>{JSON.stringify(result, null, 2)}</code></pre> -->
{/if}
