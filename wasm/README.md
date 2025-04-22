# WASM client

## Build

### Rust

```sh
wasm-pack build --out-name ironrdp --target web
```

### Golang

> All commands are meant to be run from the root directory of this project.

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
