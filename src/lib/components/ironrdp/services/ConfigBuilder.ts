// Copyright (c) Devolutions & contributors
// GitHub: Devolutions/IronRDP
// Source: https://github.com/Devolutions/IronRDP/blob/bdde2c76ded7315f7bc91d81a0909a1cb827d870/web-client/iron-remote-desktop/src/services/ConfigBuilder.ts
// Changes made:
// - Add data_channel
// - Remove anything related to RDCleanPath

import type { DesktopSize } from "../interfaces/DesktopSize";
import { Config } from "./Config";
import type { ExtensionValue } from "../interfaces/ExtensionValue";

type ExtensionConstructor = (ident: string, value: unknown) => ExtensionValue;

/**
 * Builder class for creating Config objects with a fluent interface.
 *
 * @example
 * ```typescript
 * const configBuilder = new ConfigBuilder(createExtensionFunction);
 * const config = configBuilder
 *   .withDestination(destination)
 *   .withProxyAddress(proxyAddress)
 *   .withAuthToken(authToken)
 *   ...
 *   .build();
 * ```
 */
export class ConfigBuilder {
  private extensionConstructor: ExtensionConstructor;

  private dataChannel: RTCDataChannel | undefined;
  private username: string = "";
  private password: string = "";
  private destination: string = "";
  private serverDomain: string = "";
  private desktopSize?: DesktopSize;

  private extensions: ExtensionValue[] = [];

  /**
   * Creates a new ConfigBuilder instance.
   *
   * @param extensionConstructor - Function that creates extension values from identifiers and values.
   */
  constructor(extensionConstructor: ExtensionConstructor) {
    this.extensionConstructor = extensionConstructor;
  }

  /**
   * Required parameter
   *
   * @param username - The username to use for authentication
   * @returns The builder instance for method chaining
   */
  withDataChannel(dataChannel: RTCDataChannel): ConfigBuilder {
    this.dataChannel = dataChannel;
    return this;
  }

  /**
   * Optional parameter
   *
   * @param username - The username to use for authentication
   * @returns The builder instance for method chaining
   */
  withUsername(username: string): ConfigBuilder {
    this.username = username;
    return this;
  }

  /**
   * Optional parameter
   *
   * @param password - The password for authentication
   * @returns The builder instance for method chaining
   */
  withPassword(password: string): ConfigBuilder {
    this.password = password;
    return this;
  }

  /**
   * Required parameter
   *
   * @param destination - The destination address to connect to
   * @returns The builder instance for method chaining
   */
  withDestination(destination: string): ConfigBuilder {
    this.destination = destination;
    return this;
  }

  /**
   * Optional parameter
   *
   * @param serverDomain - The server domain to connect to
   * @returns The builder instance for method chaining
   */
  withServerDomain(serverDomain: string): ConfigBuilder {
    this.serverDomain = serverDomain;
    return this;
  }

  /**
   * Optional parameter
   *
   * @param ident - The identifier for the extension
   * @param value - The value for the extension
   * @returns The builder instance for method chaining
   */
  withExtension(ident: string, value: unknown): ConfigBuilder {
    this.extensions.push(this.extensionConstructor(ident, value));
    return this;
  }

  /**
   * Optional
   *
   * @param desktopSize - The desktop size configuration object
   * @returns The builder instance for method chaining
   */
  withDesktopSize(desktopSize: DesktopSize): ConfigBuilder {
    this.desktopSize = desktopSize;
    return this;
  }

  /**
   * Builds a new Config instance.
   *
   * @throws {Error} If required parameters (destination, proxyAddress, authToken) are not set
   * @returns A new Config instance with the configured values
   */
  async build(): Promise<Config> {
    if (!this.dataChannel) {
      throw new Error("dataChannel has to be provided");
    }
    if (this.destination === "" || !URL.canParse(this.destination)) {
      throw new Error("destination has to be specified");
    }

    const userData = { username: this.username, password: this.password };

    const configOptions = {
      destination: this.destination,
      serverDomain: this.serverDomain,
      extensions: this.extensions,
      desktopSize: this.desktopSize,
    };

    return new Config(this.dataChannel, userData, configOptions);
  }
}
