# Headscale Console

[![Unstable release](https://github.com/rickli-cloud/headscale-console/actions/workflows/unstable.yaml/badge.svg)](https://github.com/rickli-cloud/headscale-console/actions/workflows/unstable.yaml)
![Current Headscale Version](https://img.shields.io/badge/Headscale-v0.26.0-blue)

**A WebAssembly-powered client for connecting to your Headscale nodes via SSH, VNC, or RDP — directly from the comfort of your browser.** Includes an optional self-service integration for seamless device onboarding and management.

> [!NOTE]  
> This project is under active development and has not yet reached a stable release.
> Expect occasional breaking changes until v1.0.0.

## Features

- **SSH Console** — Secure terminal access to your nodes
- **VNC Viewer** — Remote desktop viewing in the browser
- **RDP Client** — Secure access to Windows nodes, [inspired by Cloudflare](https://blog.cloudflare.com/browser-based-rdp/), without requiring a additional gateway
- **Self-Service** — Optional [tsnet](https://tailscale.com/kb/1244/tsnet)-based server allowing users to manage their own devices via an opt-in approach. It connects directly to the Headscale gRPC UNIX socket and requires minimal setup and maintenance.
- **Stateless** — Integrates into existing infrastructure without the need for a extra database or identity provider

## Deploy

### Notes

CORS Restrictions:

- The console must be served from the same domain as Headscale **or**
- Headscale must return the correct `access-control-allow-origin` headers

> typically handled via a reverse proxy

### Docker

A minimal Docker image is available, featuring a Go web server to serve the static files or to run the self-service API.

```sh
docker run -it ghcr.io/rickli-cloud/headscale-console:unstable serve --help
```

```sh
docker run -it ghcr.io/rickli-cloud/headscale-console:unstable selfservice --help
```

#### Image Tags

- `latest`: Latest stable release
- `x.x.x`: Specific release versions
- `x.x.x-pre`: Pre-release versions (potentially unstable)
- `unstable`: Built on every push to the main branch

#### Docker Compose

A full deployment of traefik, headscale, headscale-console & headscale-selfservice can be found in [`docker-compose.yaml`](https://github.com/rickli-cloud/headscale-console/tree/main/docker-compose.yaml).

1. Configure headscale in `config.yaml`

   See [`config-example.yaml`](https://github.com/juanfont/headscale/blob/v0.26.0/config-example.yaml)

2. Configure the environment in `.env`:

   ```sh
   # Required
   HEADSCALE_SERVER_HOSTNAME=headscale.example.com
   HEADSCALE_VERSION=0.26.0

   # Optional
   HEADSCALE_CONSOLE_VERSION=unstable
   TRAEFIK_LISTEN_ADDR=0.0.0.0
   TRAEFIK_VERSION=latest
   ```

3. Start it all up:

   ```sh
   docker compose up -d
   ```

> [!IMPORTANT]  
> When deploying for production it is recommended to use TLS between traefik and headscale.

### Static Hosting

Each release includes a downloadable ZIP archive with all required assets for deployment on static web servers (e.g., Nginx, Apache).

> All assets are loaded relative to the initial URL, so it does not matter which path you serve the app from.

## Configuration

> Configuration is **completely optional**

On startup the console tries to load `./config.json`. For the docker image you can mount `/config.json` (or somewhere else defined with the configfile flag).

### Options

Currently still in beta and not yet fully documented. See [`src/lib/store/config.ts`](https://github.com/rickli-cloud/headscale-console/tree/main/src/lib/store/config.ts) for now.

## Building from Source

### WebAssembly

Manual instructions are available in [`wasm/`](https://github.com/rickli-cloud/headscale-console/tree/main/wasm). CI workflows also publish prebuilt WASM artifacts.

### Frontend

> Requires WASM builds

Install dependencies:

```sh
deno install
```

Build the frontend:

```sh
deno task build
```

> This could also be done inside a Docker container:
>
> ```sh
> docker run -it --rm -v .:/work:rw --workdir /work --entrypoint /bin/sh denoland/deno:latest
> ```

### Docker Image

> Requires frontend build

```sh
docker build . -t headscale-console:custom
```

### Standalone Executable

> Requires frontend build

If you do not plan on running the console inside of docker you need to build the executable manually:

```sh
cp frontend.go.tmpl dist/frontend.go
go build main.go
```

> This builds a native binary for your current OS and architecture.
> For other platforms, build natively or set appropriate cross-compilation flags.

## Architecture Overview

> The TCP connection (handled by Golang) is abstracted into a `IpnRawTcpChannel` on JS side.
> It implements the `RTCDataChannel` interface to allow use with NoVNC & IronRDP but has **nothing to do with WebRTC**.

### SSH

Go handles the full protocol stack. JavaScript handles rendering.

```mermaid
sequenceDiagram
    DERP ->> Go: WebSocket
    Go ->> JS: Text
    JS ->> DOM: Render

    JS -->> Go: Input
    Go -->> DERP: WebSocket
```

### VNC

Go handles the TCP layer. JavaScript (NoVNC) manages the VNC protocol.

```mermaid
sequenceDiagram
    DERP ->> Go: WebSocket
    Go ->> JS: TCP data
    JS ->> DOM: Render

    JS -->> Go: TCP data
    Go -->> DERP: WebSocket
```

### RDP

Go handles the TCP layer. JavaScript passes packets to the Rust-based WASM module, which handles TLS, RDP, and rendering.

```mermaid
sequenceDiagram
    DERP ->> Go: WebSocket
    Go ->> JS: TCP data
    JS ->> Rust: TCP data
    Rust ->> DOM: Render

    JS -->> Rust: UI events
    Rust -->> JS: TCP data
    JS -->> Go: TCP data
    Go -->> DERP: WebSocket
```

### Self-Service API

Reaches out via the DERP relay. Traffic is not encrypted with TLS (already protected by the underlying WireGuard tunnel).

```mermaid
sequenceDiagram
    JS ->> Go: HTTP request
    Go ->> DERP: WebSocket
    DERP ->> Self-Service: WebSocket
    Self-Service ->> Headscale : GRPC

    Headscale -->> Self-Service : GRPC
    Self-Service -->> DERP: WebSocket
    DERP -->> Go: WebSocket
    Go -->> JS: HTTP response
```

## Feedback & Contributions

We value thoughtful feedback — whether it's about design decisions, usability, or ideas for improvement. You're welcome to open an issue to start a conversation. While we can’t promise to implement everything, we carefully consider all suggestions.

Contributions are welcome! However, to avoid wasted effort, please open an issue first to discuss any significant changes before submitting a pull request. Bug fixes, improvements, and well-scoped features are especially appreciated — just make sure they align with the project's direction.

## License

[MIT License](https://github.com/rickli-cloud/headscale-console/blob/main/LICENSE) - Copyright (c) 2025 rickli-cloud

Made with ❤️ for secure and hassle-free remote access.
