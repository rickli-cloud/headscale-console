<script lang="ts">
  import * as AlertDialog from "$lib/components/ui/alert-dialog";
  import { buttonVariants } from "$lib/components/ui/button";

  interface Props {
    action: () => void;
    title?: string;
    description?: string;
  }

  const {
    action,
    title = "Are you absolutely sure?",
    description = "This action cannot be undone",
  }: Props = $props();

  let isOpen = $state<boolean>(false);

  export function open() {
    isOpen = true;
  }
  export function close() {
    isOpen = false;
  }
</script>

<AlertDialog.Root bind:open={isOpen}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>{title}</AlertDialog.Title>
      <AlertDialog.Description>{description}</AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
      <AlertDialog.Action
        class={buttonVariants({ variant: "destructive" })}
        onclick={action}
      >
        Continue
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
