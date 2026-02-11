# Headscale Console

[![Unstable release](https://github.com/rickli-cloud/headscale-console/actions/workflows/unstable.yaml/badge.svg)](https://github.com/rickli-cloud/headscale-console/actions/workflows/unstable.yaml)

<!-- TODO: Renovate Group -->
<!-- ![Client Version](https://img.shields.io/badge/Client-v1.82.5-blue) -->

![/docs/media/preview-dark.png](/docs/media/preview.png)

## Features

- **Browser-Based Remote Access:**
  - **SSH:** Get a secure command-line terminal to any of your devices. Powered by [Tailscale-SSH](https://tailscale.com/kb/1193/tailscale-ssh).
  - **VNC:** Access and control the graphical desktop of your remote machines.
  - **RDP:** Securely connect to your Windows devices.

- **Secure & Stateless:** Designed with security and simplicity in mind. It doesn't need its own database or separate authentication and integrates seamlessly into your existing infrastructure without adding complexity.

- **Works with most control servers**: Behaves similar to native clients, so it’s compatible with any compliant control server.

## Documentation

- [Architecture](/docs/architecture.md)
- [Build From Source](/docs/build.md)
- [Configuration](/docs/configuration.md)
- [Deploy](/docs/deploy.md)
<!-- - [Develop](/docs/develop.md) -->

## How it works

Headscale Console is essentially a Tailscale client packaged as a web application.

> To understand what makes Headscale Console special, it's helpful to know the security rules that all web browsers must follow.

### Browser Security Sandbox

For your protection, web browsers operate within a strict "security sandbox." A website can't just open a direct network connection (like a raw TCP socket) to any device and port it wants (e.g., port 22 for SSH). Browsers are restricted to web-native protocols like HTTPS and WebSockets.

This crucial security feature prevents malicious sites from using your browser to attack other computers. However, it also creates a challenge: how can a web page possibly connect to your SSH or RDP server?

### The Solution

Headscale Console cleverly works around this limitation by combining two key technologies:

- **Headscale's DERP Relays:** Headscale uses a technology called [DERP (Designated Encrypted Relay for Packets)](https://tailscale.com/kb/1257/connection-types#relayed-connections) to create a secure, encrypted tunnel between your devices, even if they are behind complex firewalls. Crucially, connections to DERP relays are made using **WebSockets**.

- **WebAssembly (WASM):** This technology allows high-performance code, written in languages like Go or Rust, to run safely inside your browser. This means we can run the complex logic right where we need it.

**Putting It All Together:**

Missing protocols are implemented using WASM or JavaScript with existing battle-tested libraries and sent through a DERP relay.

> Refer to the [architecture documentation](/docs/architecture.md) for more details.

## Feedback & Contributions

Thoughtful feedback is always appreciated, whether it's related to design decisions, usability, or ideas for improvement. Feel free to open an issue to start a conversation. While not every suggestion can be implemented, each one is reviewed and considered with care.

Contributions are welcome! However, to avoid wasted effort, please open an issue first to discuss any significant changes before submitting a pull request. Bug fixes, improvements, and well-scoped features are especially appreciated — just make sure they align with the project's direction.

## License

[MIT License](https://github.com/rickli-cloud/headscale-console/blob/main/LICENSE) - Copyright (c) 2025 rickli-cloud

Made with ❤️ for secure and hassle-free remote access.

> [!NOTE]  
> Third-party software. This project has no affiliation with any named projects or organizations.
