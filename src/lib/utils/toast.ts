import type { AnyComponent } from "node_modules/svelte-sonner/dist/types";
import { toast, type ExternalToast } from "svelte-sonner";

import { cn } from "./shadcn";

export default {
  dismiss: toast.dismiss,
  error: <T extends AnyComponent>(err: unknown, opt?: ExternalToast<T>) => {
    return toast(err?.toString() || "Unknown error occurred", {
      ...opt,
      class: cn("!bg-destructive !text-destructive-foreground", opt?.class),
    });
  },
  warn: <T extends AnyComponent>(msg: string | T, opt?: ExternalToast<T>) => {
    return toast(msg, {
      ...opt,
      class: cn("!bg-yellow-600 !text-white", opt?.class),
    });
  },
  info: <T extends AnyComponent>(msg: string | T, opt?: ExternalToast<T>) => {
    return toast(msg, {
      ...opt,
      class: cn("!bg-background !text-foreground", opt?.class),
    });
  },
};
