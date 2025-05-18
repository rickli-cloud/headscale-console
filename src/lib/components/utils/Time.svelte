<script lang="ts">
  import { onMount } from "svelte";

  interface Props {
    update: () => number;
  }

  let { update }: Props = $props();

  let stamp = $state<string>(formatDuration(update()));

  function formatDuration(ms: number): string {
    const map: (number | null)[] = [
      Math.floor(ms / 1000) % 60,
      Math.floor(ms / 60000) % 60,
      Math.floor(ms / 3600000) % 24,
      Math.floor(ms / 86400000) % 365,
    ];

    // Remove empty block
    for (let i = map.length; i >= 0; i--) {
      if (i === 1) break; // Min 2 blocks
      if (map[i] === 0 || typeof map[i] === "undefined") map[i] = null;
      else break;
    }

    return map
      .reverse()
      .filter((i) => i !== null)
      .map((i) => (i === 0 ? "00" : String(i).length === 1 ? "0" + i : i))
      .join(":");
  }

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
