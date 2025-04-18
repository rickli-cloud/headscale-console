# Headscale Console

A web-based SSH, VNC, and RDP client interface for [`@juanfont/headscale`](https://github.com/juanfont/headscale).  
Connect to your nodes directly from the browser using WebAssembly.

## Features

- **SSH Console**: Secure terminal access to your nodes.
- **VNC Viewer**: View remote desktops from the browser.
- **RDP Client**: Experimental support for Remote Desktop via WebAssembly, ideal for connecting to Windows nodes—no additional server required.

## Deployment

Due to browser CORS restrictions and the absence of a full configuration system, the console must be served from the **same domain** as Headscale — usually via a reverse proxy setup.

The WASM client is only able to connect to other nodes over a DERP relay via a websocket. Depending on the setup this might not work correctly. Best results are achieved by using the embedded DERP server of headscale.

### Docker

A minimal Docker image is available, featuring a [simple Go web server](https://github.com/rickli-cloud/headscale-console/blob/main/server.go) to serve the static files.

#### Image Tags

- `latest`: Latest stable release
- `x.x.x`: Specific release versions
- `x.x.x-pre`: Pre-release versions (potentially unstable)
- `unstable`: Built on every push to the main branch

#### Example Usage

```sh
docker run -it -p 3000:3000 ghcr.io/rickli-cloud/headscale-console:latest --base="/admin"
```

### Static Hosting

> Everything gets loaded relative to the initial url. It does not matter on what path you serve the app.

Each release includes a downloadable ZIP archive with all required assets for deployment on static web servers (e.g., Nginx, Apache).

## Development

> The WASM client must be built manually. See [`./wasm`](https://github.com/rickli-cloud/headscale-console/tree/main/wasm) for details.

Install dependencies:

```sh
deno install
```

Start the development server:

```sh
deno task dev
```

## Building

### WASM Client

Manual build instructions are available in the [`./wasm`](https://github.com/rickli-cloud/headscale-console/tree/main/wasm) directory.  
Refer to the GitHub Actions workflows for the automated build process.

### Svelte App

> [!TIP]  
> You can also build the app inside a Docker container:
>
> ```sh
> docker run -it --rm --workdir /app -v ${PWD}:/app:rw --entrypoint /bin/sh denoland/deno:latest
> ```

Install dependencies:

```sh
deno install
```

Build the Svelte frontend:

```sh
deno task build
```

### Docker Image

> The docker image does not build the svelte app, only bundles the static files into a small server.
> Make sure to build the app in advance.

```sh
docker build . -t headscale-console:custom
```
