<script lang="ts">
  import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
  import { buttonVariants } from "../ui/button";

  let isOpen = $state(false);

  export function toggle() {
    isOpen = !isOpen;
  }
  export function close() {
    isOpen = false;
  }
  export function open() {
    isOpen = true;
  }

  function logout() {
    window.ipn.logout();
  }
</script>

<AlertDialog.Root bind:open={isOpen}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Log out?</AlertDialog.Title>
      <AlertDialog.Description>
        This will terminate all active sessions and clear any related data
      </AlertDialog.Description>
    </AlertDialog.Header>

    <br />

    <AlertDialog.Footer>
      <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
      <AlertDialog.Action
        onclick={logout}
        class={buttonVariants({ variant: "destructive" })}
      >
        Continue
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
