<script lang="ts">
  import { onMount } from "svelte";

  import { formatDuration } from "$lib/utils/time";

  interface Props {
    update: () => number;
  }

  let { update }: Props = $props();

  let stamp = $state<string>(formatDuration(update()));

  onMount(() => {
    const updateInterval = setInterval(() => {
      stamp = formatDuration(update());
    }, 1000);

    return () => {
      clearInterval(updateInterval);
    };
  });
</script>

{stamp}
