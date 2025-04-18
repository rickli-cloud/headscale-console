// Copyright (c) Devolutions & contributors
// GitHub: Devolutions/IronRDP
// Source: https://github.com/Devolutions/IronRDP/blob/bdde2c76ded7315f7bc91d81a0909a1cb827d870/web-client/iron-remote-desktop/src/services/logging.service.ts

export class LoggingService {
  verbose: boolean = false;

  info(description: string) {
    if (this.verbose) {
      console.log(description);
    }
  }

  error(description: string, object?: unknown) {
    if (this.verbose) {
      console.error(description, object);
    }
  }
}

export const loggingService = new LoggingService();
