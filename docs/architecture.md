# Architecture Overview

- [Authentication](#authentication)
- [SSH](#ssh)
- [VNC](#vnc)
- [RDP](#rdp)
- [Tsnet Microservices](#tsnet-microservices)

> The TCP connection (handled by Golang) is abstracted into a `IpnRawTcpChannel` on JS side.
> It implements the `RTCDataChannel` interface to allow use with NoVNC & IronRDP but has **nothing to do with WebRTC**.

## Authentication

Authentication via the IdP can occur in a new tab or on a separate device, but the original tab must remain open at all times to receive the authorization callback.

```mermaid
sequenceDiagram
    Participant user as User
    Participant js as JavaScript
    Participant go as Go WASM
    Participant headscale as Headscale
    Participant idp as Identity Provider

    user->>js: Opens tab
    js->>go: Start client
    go->>js: Notifies: NeedsLogin
    js->>go: Calls login()

    go->>headscale: Request authorization URL
    headscale->>go: Provides unique URL
    go->>js: Notifies: browseToURL
    js->>user: Display URL (Link/QR)

    rect rgba(255,255,255,0.1)
    user->>idp: Opens link / Scans QR
    Note over user,idp: New tab or device
    idp->>headscale: user authenticates and authorizes device
    end

    headscale->>go: Notifies: Authorized
    go->>js: Notifies: Running
    js->>user: Render UI
```

## SSH

Go handles the full protocol stack. JavaScript (xterm) handles rendering.

```mermaid
sequenceDiagram
    Participant derp as DERP
    Participant go as Go WASM
    Participant js as JavaScript
    Participant dom as DOM

    derp ->> go: WebSocket
    go ->> js: Text
    js ->> dom: Render

    js -->> go: Input
    go -->> derp: WebSocket
```

## VNC

Go handles the TCP layer. JavaScript (NoVNC) manages the VNC protocol.

```mermaid
sequenceDiagram
    Participant derp as DERP
    Participant go as Go WASM
    Participant js as JavaScript
    Participant dom as DOM

    derp ->> go: WebSocket
    go ->> js: TCP data
    js ->> dom: Render

    js -->> go: TCP data
    go -->> derp: WebSocket
```

## RDP

Go handles the TCP layer. JavaScript passes packets to the Rust-based WASM module (IronRDP), which handles TLS, RDP, and rendering.

```mermaid
sequenceDiagram
    Participant derp as DERP
    Participant go as Go WASM
    Participant js as JavaScript
    Participant rust as Rust WASM
    Participant dom as DOM

    derp ->> go: WebSocket
    go ->> js: TCP data
    js ->> rust: TCP data
    rust ->> dom: Render

    js -->> rust: UI events
    rust -->> js: TCP data
    js -->> go: TCP data
    go -->> derp: WebSocket
```

## Tsnet Microservices

> Used for selfservice & policyservice API

Reaches out via the derp relay. Traffic is not encrypted with TLS (already protected by the underlying WireGuard tunnel).

```mermaid
sequenceDiagram
    Participant js as JavaScript
    Participant go as Go WASM
    Participant derp as DERP
    Participant selfservice as Self-Service
    Participant headscale as Headscale

    js ->> go: HTTP request
    go ->> derp: WebSocket
    derp ->> selfservice: WebSocket
    selfservice ->> headscale : GRPC

    headscale -->> selfservice : GRPC
    selfservice -->> derp: WebSocket
    derp -->> go: WebSocket
    go -->> js: HTTP response
```
