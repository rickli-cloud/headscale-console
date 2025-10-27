# Headscale Console

[![Unstable release](https://github.com/rickli-cloud/headscale-console/actions/workflows/unstable.yaml/badge.svg)](https://github.com/rickli-cloud/headscale-console/actions/workflows/unstable.yaml)
![Current Headscale Version](https://img.shields.io/badge/Headscale-v0.26-blue)

**A WebAssembly-powered client for connecting to your Headscale nodes via SSH, VNC, or RDP - directly from the comfort of your browser.**

- [Features](#features)
- [How it works](#how-it-works)
- [Deploy](#deploy)
  - [Docker](#docker)
  - [Static Hosting](#static-hosting)
- [Documentation](#documentation)
- [Feedback & Contributions](#feedback--contributions)
- [License](#license)

![/docs/media/preview-dark.png](/docs/media/preview.png)

## Features

- **Browser-Based Remote Access:**

  - **SSH Console:** Get a secure command-line terminal to any of your devices. Powered by [Tailscale-SSH](https://tailscale.com/kb/1193/tailscale-ssh).
  - **VNC Viewer:** Access and control the graphical desktop of your remote machines.
  - **RDP Client:** Securely connect to your Windows devices, [inspired by Cloudflare's innovative approach](https://blog.cloudflare.com/browser-based-rdp/), without needing a separate gateway.

- **Optional [tsnet](https://tailscale.com/kb/1244/tsnet) Microservices**:

  - **Self-Service:** Allows users to independently add and manage their own devices.
  - **Policy-Service:** Allows admins to edit the policy with built in intellisense.

- **Secure & Stateless:** Designed with security and simplicity in mind. It doesn't need its own database or authentication and integrates seamlessly into your existing infrastructure without adding complexity.

## How it works

Headscale Console is essentially a Tailscale client packaged as a web application.

> To understand what makes Headscale Console special, it's helpful to know the security rules that all web browsers must follow.

### Browser Security Sandbox

For your protection, web browsers operate within a strict "security sandbox." A website can't just open a direct network connection (like a raw TCP socket) to any device and port it wants (e.g., port 22 for SSH). Browsers are restricted to web-native protocols like HTTPS and WebSockets.

This crucial security feature prevents malicious sites from using your browser to attack other computers. However, it also creates a challenge: how can a web page possibly connect to your SSH or RDP server?

### The Solution

Headscale Console cleverly works around this limitation by combining two key technologies:

- **WebAssembly (WASM):** This technology allows high-performance code, written in languages like Go or Rust, to run safely inside your browser. This means we can run the complex logic right where we need it.

- **Headscale's DERP Relays:** Headscale uses a technology called [DERP (Designated Encrypted Relay for Packets)](https://tailscale.com/kb/1257/connection-types#relayed-connections) to create a secure, encrypted tunnel between your devices, even if they are behind complex firewalls. Crucially, connections to DERP relays are made using **WebSockets**.

**Putting It All Together:**

Missing protocols are implemented using WASM or JavaScript with existing battle-tested libraries and sent through a DERP relay.

> Refer to the [architecture documentation](/docs/architecture.md) for more details.

## Deploy

### Important Note on CORS Restrictions

For security, web browsers enforce a policy called the "Same-Origin Policy," which prevents a website from one address (like `console.example.com`) from making requests to a server at a different address (like `headscale.example.com`).

To make this work, you have two options:

1. Serve the Headscale Console from the **same domain** as your Headscale server.
2. Configure your Headscale server (usually via a reverse proxy) to send a special header (`Access-Control-Allow-Origin`) that tells the browser it's okay to accept requests from the console's domain.

> Don't worry, the **[Docker Compose example](#docker-compose)** below handles this for you automatically

### Docker

Show all available commands:

```sh
docker run -it ghcr.io/rickli-cloud/headscale-console:unstable --help
```

#### Image Tags

- `latest`: Latest stable release
- `x.x.x`: Specific release versions
- `x.x.x-pre`: Pre-release versions (potentially unstable)
- `unstable`: Built on every push to the main branch
- `next`: Built on every push to the next branch (may contain undocumented features)

#### Docker Compose

A full deployment of traefik, headscale, headscale-console, headscale-selfservice & headscale-policyservice can be found in [`docker-compose.yaml`](/docker-compose.yaml).

1. **Configure headscale** in `config.yaml`

   See [`config-example.yaml`](https://github.com/juanfont/headscale/blob/v0.26.1/config-example.yaml)

2. **Configure environment variables** in `.env`:

   ```sh
   # Required
   HEADSCALE_SERVER_HOSTNAME=headscale.example.com
   HEADSCALE_VERSION=0.26.1

   # Optional
   HEADSCALE_CONSOLE_VERSION=unstable
   TRAEFIK_LISTEN_ADDR=0.0.0.0
   TRAEFIK_VERSION=latest
   ```

3. **Configure Headscale Console** in `config.json`

   ```json
   {
     "selfserviceHostname": "self-service",
     "policyserviceHostname": "policy-service"
   }
   ```

   > See [docs/configuration.md](/docs/configuration.md) for more

4. **Start it up**

   ```sh
   docker compose up -d
   ```

> [!IMPORTANT]  
> When deploying for production it is recommended to use TLS between traefik and headscale.

### Static Hosting

Each release includes a downloadable ZIP archive with all required assets for deployment on static web servers (e.g., Nginx, Apache).

> All assets are loaded relative to the initial URL, so it does not matter which path you serve the app from.

## Documentation

- [Architecture](/docs/architecture.md)
- [Build From Source](/docs/build.md)
- [Configuration](/docs/configuration.md)
<!-- - [Develop](/docs/develop.md) -->

## Feedback & Contributions

Thoughtful feedback is always appreciated, whether it's related to design decisions, usability, or ideas for improvement. Feel free to open an issue to start a conversation. While not every suggestion can be implemented, each one is reviewed and considered with care.

Contributions are welcome! However, to avoid wasted effort, please open an issue first to discuss any significant changes before submitting a pull request. Bug fixes, improvements, and well-scoped features are especially appreciated — just make sure they align with the project's direction.

## License

[MIT License](https://github.com/rickli-cloud/headscale-console/blob/main/LICENSE) - Copyright (c) 2025 rickli-cloud

Made with ❤️ for secure and hassle-free remote access.
