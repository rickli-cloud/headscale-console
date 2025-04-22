export interface ConnectParams {
  proto: "ssh" | "vnc" | "rdp";

  host?: string;

  port?: number;

  // TODO: Authkey
  // key?: string;
}

// Simple base64 based (url) encoding

export function encodeConnectParams(data: ConnectParams): string {
  return btoa(
    JSON.stringify(data)
      .replaceAll(/=/gm, "")
      .replaceAll(/\//gm, "_")
      .replaceAll(/\+/gm, "-")
  );
}

export function decodeConnectParams(data: string): ConnectParams {
  return JSON.parse(atob(data.replaceAll(/_/gm, "/").replaceAll(/\-/gm, "+")));
}
