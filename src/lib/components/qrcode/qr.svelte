<script lang="ts">
  import { onMount } from "svelte";
  import QrCode from "qrcode-svg";

  interface Props extends QrCode.Options {}

  const opt: Props = $props();

  let svg = $state<string>();

  onMount(() => {
    svg = new QrCode({
      background: "transparent",
      color: "currentcolor",
      container: "svg-viewbox",
      padding: 0,
      ...opt,
    }).svg();
  });
</script>

{#if svg}
  {@html svg}
{/if}
