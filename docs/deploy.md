# Deploy

> [!NOTE]  
> For security, web browsers enforce a policy called the "Same-Origin Policy,"
> which prevents a website from one address (like `console.example.com`) from making
> requests to a server at a different address (like `headscale.example.com`).
>
> To make this work, you have two options:
>
> - Serve the app from the **same domain** as your Headscale server.
> - Configure your control server (usually via a reverse proxy) to send a special header
>   (`Access-Control-Allow-Origin`) that tells the browser it's okay to accept requests from the console's domain.

## Static Hosting

Each release includes a downloadable ZIP archive with all required assets for deployment on static web servers (e.g., Nginx, Apache).

> All assets are loaded relative to the initial URL, so it does not matter which path you serve the app from.

## Docker

Show all available commands:

```sh
docker run -it ghcr.io/rickli-cloud/headscale-console:latest --help
```

### Image Tags

- `latest`: Latest stable release
- `x.x.x`: Specific release versions
- `x.x.x-pre`: Pre-release versions (potentially unstable)
- `unstable`: Built on every push to the main branch

### Docker Compose

A full production deployment of traefik, headscale & headscale-console can be found in [`docker-compose.yaml`](/docker-compose.yaml).

1. **Configure headscale** in `config.yaml`

   See [`config-example.yaml`](https://github.com/juanfont/headscale/blob/v0.29.4/config-example.yaml)

   > [!NOTE]
   > Headscale Console is tested against Headscale **v0.29.4** and requires **v0.29.2 or newer**.
   > Earlier releases reject the WebSocket upgrade on `/ts2021` which the browser client relies on.
   >
   > Headscale enforces a strict upgrade path: upgrade one minor version at a time (e.g. 0.27 → 0.28 → 0.29).
   > See the [Headscale changelog](https://github.com/juanfont/headscale/blob/v0.29.4/CHANGELOG.md) for breaking changes.

   The browser client connects to the control server via WebSockets on the default HTTPS port (443).
   Headscale must therefore be reachable on port 443 (e.g. behind a reverse proxy) with a valid TLS certificate.

2. **Configure environment variables** in `.env`:

   ```sh
   # Required
   HEADSCALE_SERVER_HOSTNAME=headscale.example.com
   HEADSCALE_VERSION=0.29.4

   # Optional
   HEADSCALE_CONSOLE_VERSION=latest
   TRAEFIK_LISTEN_ADDR=0.0.0.0
   TRAEFIK_VERSION=latest
   ```

3. **Start it all up**

   ```sh
   docker compose up -d
   ```

> The UI can now be accessed on your hostname under `/admin`. E.g. `https://headscale.example.com/admin`
