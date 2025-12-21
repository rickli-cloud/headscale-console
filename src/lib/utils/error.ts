export class ServerError extends Error {
  public readonly name = "ServerError";

  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
  }
}
