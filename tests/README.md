# SSH quick-connect tests

Install the locked dependencies and obtain the WASM packages as described in
the build guide. Then run:

```sh
deno install --frozen
deno task check
deno task test
deno run -A npm:@playwright/test@1.63.0 install --with-deps chromium firefox
deno task test:e2e
deno task build
```

The browser tests mount the real Settings and Connect/Xterm components through
`tests/browser.html`, with a synthetic profile and IPN implementation. They never
start the WASM client or contact a real control server, IdP or destination. The
fixture is a separate Vite entry and is not included in the production build.
These tests verify UI behavior, not live SSH authorization or connectivity.
