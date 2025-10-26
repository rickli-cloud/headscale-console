import { toast, type ExternalToast } from "svelte-sonner";
import type { AnyComponent } from "node_modules/svelte-sonner/dist/types";
import { cn } from "./shadcn";

export function errorToast<T extends AnyComponent>(
  err: unknown,
  opt?: ExternalToast<T>
) {
  toast(err?.toString() || "Unknown error occurred", {
    ...opt,
    class: cn("!bg-destructive !text-destructive-foreground", opt?.class),
  });
}

export class ServerError extends Error {
  public readonly name = "ServerError";

  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
  }
}
