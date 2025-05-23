// Copyright (c) Tailscale Inc & AUTHORS
// SPDX-License-Identifier: BSD-3-Clause

export {};

/**
 * @fileoverview Type definitions for types exported by the wasm_js.go Go
 * module.
 */

declare global {
  function newIPN(config: IPNConfig): IPN;

  interface IPN {
    run(callbacks: IPNCallbacks): void;
    login(): void;
    logout(): void;
    ssh(
      host: string,
      username: string,
      termConfig: {
        writeFn: (data: string) => void;
        writeErrorFn: (err: string) => void;
        setReadFn: (readFn: (data: string) => void) => void;
        rows: number;
        cols: number;
        /** Defaults to 5 seconds */
        timeoutSeconds?: number;
        onConnectionProgress: (message: string) => void;
        onConnected: () => void;
        onDone: () => void;
      }
    ): IPNSSHSession;
    fetch(options: IPNFetchOptions): Promise<IPNFetchResponse>;
    tcp(config: {
      hostname: string;
      port: number;
      readCallback: (data: Uint8Array) => void;
      connectTimeoutSeconds?: number;
      writeBufferSizeInBytes?: number;
      readBufferSizeInBytes?: number;
    }): Promise<IPNTCPSession>;
    /** Experimental */
    resolve(hostname: string): Promise<{
      result: string;
      resolvers: string[];
    }>;
  }

  interface IPNSSHSession {
    resize(rows: number, cols: number): boolean;
    close(): boolean;
  }

  interface IPNTCPSession {
    remoteAddr: string;
    close(): Promise<void>;
    write(buffer: Uint8Array): Promise<number>;
  }

  interface IPNStateStorage {
    setState(id: string, value: string): void;
    getState(id: string): string;
  }

  type IPNConfig = {
    stateStorage?: IPNStateStorage;
    authKey?: string;
    controlURL?: string;
    hostname?: string;
    routeAll?: boolean;
    advertiseTags?: string;
  };

  type IPNCallbacks = {
    notifyState: (state: IPNState) => void;
    notifyNetMap: (netMapStr: string) => void;
    notifyBrowseToURL: (url: string) => void;
    notifyPanicRecover: (err: string) => void;
  };

  type IPNNetMap = {
    domain: string;
    self: IPNNetMapSelfNode;
    peers: IPNNetMapPeerNode[];
    lockedOut: boolean;
    users: IPNNetMapUsers;
  };

  type IPNNetMapNode = {
    name: string;
    addresses: string[];
    machineKey: string;
    nodeKey: string;
    createdAt: string;
    ipnVersion: string;
  };

  type IPNNetMapUsers = {
    [id: string]: {
      ID: number;
      LoginName: string;
      DisplayName: string;
      ProfilePicURL: string;
      Roles: unknown[];
    };
  };

  type IPNNetMapSelfNode = IPNNetMapNode & {
    machineStatus: IPNMachineStatus;
  };

  type IPNNetMapPeerNode = IPNNetMapNode & {
    id: string;
    os: string;
    osVersion: string;
    lastSeen: string;
    user: string;
    routes: string[] | null;
    tags: string[] | null;
    online: boolean;
    expired: boolean;
    tailscaleSSHEnabled: boolean;
  };

  /** Mirrors values from ipn/backend.go */
  type IPNState =
    | "NoState"
    | "InUseOtherUser"
    | "NeedsLogin"
    | "NeedsMachineAuth"
    | "Stopped"
    | "Starting"
    | "Running";

  /** Mirrors values from MachineStatus in tailcfg.go */
  type IPNMachineStatus =
    | "MachineUnknown"
    | "MachineUnauthorized"
    | "MachineAuthorized"
    | "MachineInvalid";

  interface IPNFetchOptions {
    /** The url to request. Works with magicDNS hostnames */
    url: string;
    /** HTTP method to use for the request */
    method?: string;
    /** Headers to include in the request */
    headers?: Record<string, string[]>;
    /** Body to send with the request */
    // body?: string;
    /** Whether to skip TLS verification */
    // skipTLSVerify?: boolean;
  }

  interface IPNFetchResponse {
    /** HTTP status code */
    status: number;
    /** HTTP status text */
    statusText: string;
    /** Response headers */
    headers: Record<string, string>;
    /** Get response body as text */
    text(): Promise<string>;
  }
}
