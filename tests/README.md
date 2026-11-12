# SSH preference tests

Use the existing Deno dependency setup, then run the focused tests without adding
a test framework or changing CI:

```sh
deno install --frozen
deno test --allow-env=NODE_ENV tests/ssh_test.ts
```

These tests cover username resolution, input validation and preference persistence.
