<script lang="ts">
  import * as Avatar from "$lib/components/ui/avatar";
  import * as Table from "$lib/components/ui/table";

  import { shortName } from "$lib/utils/misc";
  import { netMap } from "$lib/store/ipn";
</script>

<section class="space-y-4">
  <header>
    <h3 class="scroll-m-20 text-2xl font-semibold tracking-tight">
      Network Members
    </h3>
  </header>

  <Table.Root>
    <Table.Body>
      {#each Object.values($netMap?.users || {}) as user}
        <Table.Row>
          <Table.Cell class="w-8">
            <Avatar.Root class="h-8 w-8 rounded-lg">
              <Avatar.Image src={user.ProfilePicURL} alt={user.DisplayName} />
              <Avatar.Fallback class="rounded-lg">
                {shortName(user?.DisplayName || user?.LoginName || user?.ID)}
              </Avatar.Fallback>
            </Avatar.Root>
          </Table.Cell>

          <Table.Cell>
            <div class="flex gap-1.5 items-center h-full">
              <span>
                {user.DisplayName}
              </span>
              <!-- {#if user.ID === window.ipnProfile?.Config?.UserProfile?.ID}
              <span class="text-muted-foreground font-semibold">(Self)</span>
            {/if} -->
              <span class="text-muted-foreground">
                {user.LoginName}
              </span>
            </div>
          </Table.Cell>

          <Table.Cell class="w-10 text-muted-foreground">
            #{user.ID}
          </Table.Cell>
        </Table.Row>
      {/each}
    </Table.Body>
  </Table.Root>
</section>
