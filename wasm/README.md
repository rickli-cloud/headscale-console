# WASM

## Rust

Responsible for handling RDP connections (framing, TLS & rendering).

### Build Rust WASM

```sh
wasm-pack build --out-name ironrdp --target web
```

> Builds `wasm/pkg` which is then imported by JS thru vite package alias ($pkg/...).

## Golang

A WASM client that allows connecting to your Headscale instance over ts2021 & DERP.

### Build Golang WASM

> [!IMPORTANT]  
> All commands are meant to be run from the root directory of this project.

To build inside Docker:

```sh
docker run -it --rm -v .:/work:rw --workdir /work golang:latest
# Inside container
apt update && apt install binaryen
```

#### Build initial binary

```sh
GOOS=js GOARCH=wasm go build -trimpath -ldflags "-s -w" -o ./src/lib/api/tsconnect/pkg/client.wasm ./wasm/wasm.go
```

#### Optimize with binaryen

```sh
wasm-opt --enable-bulk-memory -Oz ./src/lib/api/tsconnect/pkg/client.wasm -o ./src/lib/api/tsconnect/pkg/client.wasm
```

#### Copy required helper functions

```sh
cp "$(go env GOROOT)/misc/wasm/wasm_exec.js" ./src/lib/api/tsconnect/pkg/wasm_exec.js
```

> Could also be at `$(go env GOROOT)/lib/wasm/wasm_exec.js`
