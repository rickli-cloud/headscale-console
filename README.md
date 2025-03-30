# Headscale Console

Web based SSH & VNC console for `@juanfont/headscale`.

## Deploy

Because of CORS restrictions and the current lack of a configuration system, the application must share the same domain as Headscale, typically via a reverse proxy.

> **Be aware:** The WASM client is only able to connect to other nodes over a DERP relay via a websocket. Depending on the setup this might not work correctly. Best results are achieved by using the embedded DERP server of headscale.

### Docker

Docker image built from scratch with a [basic golang webserver](https://github.com/rickli-cloud/headscale-console/blob/main/server.go).

#### Tags

- `latest`: Latest stable release
- `x.x.x`: Specific release versions
- `x.x.x-pre`: Pre-release versions (potentially unstable)
- `unstable`: Built on every push to the main branch

#### Basic example

```sh
docker run -it -p 3000:3000 ghcr.io/rickli-cloud/headscale-console:latest --base="/admin"
```

### Static server

> Everything gets loaded relative to the initial url. It does not matter on what path you serve the app.

You can download a zip archive for each release containing almost everything needed to deploy on a static webserver like Nginx or Apache.

## Development

> The WASM client needs to be built manually. See [`./wasm`](https://github.com/rickli-cloud/headscale-console/tree/main/wasm)

Install Dependencies:

```sh
deno install
```

Start Development Server:

```sh
deno task dev
```

## Building

### WASM Client

See [`./wasm`](https://github.com/rickli-cloud/headscale-console/tree/main/wasm) on how to manually build the WASM client or study `.github/workflows` for automated builds.

### Svelte app

> [!TIP]  
> This can be done in Docker:
>
> ```sh
> docker run -it --rm --workdir /app -v ${PWD}:/app:rw --entrypoint /bin/sh denoland/deno:latest
> ```

Install Dependencies:

```sh
deno install
```

Build the app:

```sh
deno task build
```

### Docker image

> The docker image does not build the svelte app, only bundles the static files into a small server.
> Make sure to build the app in advance.

```sh
docker build . -t headscale-console:custom
```
