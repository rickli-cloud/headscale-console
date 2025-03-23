# Headscale Console

Web based SSH console for `@juanfont/headscale`.

## Features

- **Tailscale web client based on WASM**: Directly connect to your tailnet from your browser (DERP only).
- **SSH Console**: Manage nodes with Tailscale SSH enabled.

## Deploy

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

> The official Tailscale WASM client `@tailscale/connect` is unfortunately not really maintained and on a too old client version to connect to a current headscale instance. Therefore it has to be replaced by a newer manual build located in the public folder.

Install Dependencies:

```sh
deno install
```

Start Development Server:

```sh
deno task dev
```

## Building

> [!TIP]  
> This can be done in Docker:
>
> ```sh
> docker run -it --rm --workdir /app -v ${PWD}:/app:rw --entrypoint /bin/sh denoland/deno:latest
> ```

### Svelte app

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
