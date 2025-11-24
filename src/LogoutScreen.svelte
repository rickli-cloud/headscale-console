<script>
  import Button from "$lib/components/ui/button/button.svelte";
</script>

<main>
  <div
    class="px-6 py-4 space-y-6 w-full max-w-96 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 sm:border bg-background z-50"
  >
    <div class="space-y-2">
      <h3 class="scroll-m-20 text-2xl font-semibold tracking-tight">
        Logged Out
      </h3>
      <p class="text-muted-foreground">
        The session has ended. Start a new session and sign in again.
      </p>
    </div>

    <Button class="w-full" onclick={() => window.location.reload()}>
      New Session
    </Button>
  </div>
</main>
