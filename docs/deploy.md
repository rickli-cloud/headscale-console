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

   See [`config-example.yaml`](https://github.com/juanfont/headscale/blob/v0.28.0/config-example.yaml)

2. **Configure environment variables** in `.env`:

   ```sh
   # Required
   HEADSCALE_SERVER_HOSTNAME=headscale.example.com
   HEADSCALE_VERSION=0.27.1

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
