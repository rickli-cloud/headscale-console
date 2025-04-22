<script lang="ts">
  import { onMount } from "svelte";
  import QrCode from "qrcode-svg";

  interface Props extends QrCode.Options {}

  const opt: Props = $props();

  let svg = $state<string>();

  onMount(() => {
    const qr = new QrCode(opt);
    qr.options.background = "transparent";
    qr.options.color = "currentcolor";
    qr.options.container = "svg-viewbox";
    qr.options.padding = 0;

    svg = qr.svg();
  });
</script>

{#if svg}
  {@html svg}
{/if}
