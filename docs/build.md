# Build from Source

## WebAssembly

Manual instructions are available in [`wasm/`](/wasm/README.md).

> [CI build workflows](https://github.com/rickli-cloud/headscale-console/actions) also publish prebuilt artifacts.
>
> | Artifact        | Source                     | Description       |
> | --------------- | -------------------------- | ----------------- |
> | app-pkg         | dist/                      | Frontend build    |
> | golang-wasm-pkg | src/lib/api/tsconnect/pkg/ | Golang WASM build |
> | rust-wasm-pkg   | wasm/pkg/                  | Rust WASM build   |

## Frontend

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

## Docker Image

> Requires frontend build

This builds the Golang server inside the Docker container with the desired platform architecture.

```sh
docker build . -t headscale-console:custom
```

## Standalone Executable

> Requires frontend build

If you do not plan on running the console inside of docker you need to build the executable manually:

```sh
go build main.go
```

> This builds a native binary for your current OS and architecture.
> For other platforms, build natively or set appropriate cross-compilation flags.
