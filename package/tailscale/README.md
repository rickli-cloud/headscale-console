# Tailscale

A WASM client that allows connecting to your Headscale instance over ts2021 & DERP.

## Build Golang WASM

> [!IMPORTANT]  
> All commands are meant to be run from the root directory of this project.

To build inside Docker:

```sh
docker run -it --rm -v .:/work:rw --workdir /work golang:latest
# Inside container
apt update && apt install binaryen
```

### Build initial binary

```sh
GOOS=js GOARCH=wasm go build -trimpath -ldflags "-s -w" -o ./package/tailscale/pkg/tailscale.wasm ./package/tailscale/tailscale.go
```

### Optimize with binaryen

```sh
wasm-opt --enable-bulk-memory -Oz ./package/tailscale/pkg/tailscale.wasm -o ./package/tailscale/pkg/tailscale.wasm
```

### Copy required helper functions

```sh
cp "$(go env GOROOT)/lib/wasm/wasm_exec.js" ./package/tailscale/pkg/wasm_exec.js
```

> Could also be at `$(go env GOROOT)/misc/wasm/wasm_exec.js`
