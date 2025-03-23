<script lang="ts">
  import ArrowRight from "lucide-svelte/icons/arrow-right";

  interface Props {
    url: string;
  }

  const { url }: Props = $props();
</script>

<div class="w-screen h-screen grid place-items-center">
  <main class="h-auto flex items-center flex-col gap-y-3">
    <h1 class="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
      Authenticate
    </h1>

    <a
      href={url}
      class="text-lg font-semibold flex items-center gap-x-1.5 hover:underline"
    >
      <ArrowRight class="h-5 w-5 mt-0.5" />
      Continue
    </a>
  </main>
</div>
