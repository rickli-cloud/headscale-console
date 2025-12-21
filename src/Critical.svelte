<script lang="ts">
  interface Props {
    title: string;
    message: string;
  }

  const { title, message }: Props = $props();
</script>

<main class="p-12 sm:p-16 space-y-2">
  <h3
    class="scroll-m-20 text-2xl font-semibold tracking-tight text-destructive"
  >
    {title}
  </h3>
  <p class="text-destructive/80">{message}</p>
</main>
