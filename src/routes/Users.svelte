<script lang="ts">
  import NetworkMembers from "$lib/components/data/user/UsersTable.svelte";

  import Layout from "../Layout.svelte";
</script>

<Layout>
  <section class="space-y-1.5">
    <h3 class="scroll-m-20 text-2xl font-semibold tracking-tight">
      Network Members
    </h3>
    <p class="text-muted-foreground">
      Some users might be hidden when access is restricted
    </p>
  </section>

  <section class="space-y-10">
    <NetworkMembers />
  </section>
</Layout>
