import { mount, unmount, type Component } from "svelte";

export type AppRoute = { path: string | RegExp; component: Component };

export class AppRouter {
  protected mount?: object;

  public readonly routes: AppRoute[] = [];
  public fallbackComponent: Component;
  public target: HTMLElement;

  public onResolve?: (path: string) => string;

  public constructor(data: {
    target: HTMLElement;
    fallbackComponent: Component;
    routes?: AppRoute[];
  }) {
    if (data.routes) this.routes = data.routes;
    this.fallbackComponent = data.fallbackComponent;
    this.target = data.target;

    window.addEventListener("hashchange", () => this.resolve());
    window.addEventListener("popstate", () => this.resolve());
  }

  public get currentPath(): string {
    const wrapper = this.onResolve || ((path) => path);
    return wrapper(window.location.hash.replace(/^#/, "").replace(/^\/?/, "/"));
  }

  public get searchParams(): URLSearchParams {
    const raw = window.location.hash.split("?");
    return new URLSearchParams(raw[raw.length - 1]);
  }

  public goto(url: URL): this {
    history.pushState(null, "", url.toString());
    this.resolve();
    return this;
  }

  public async resolve(): Promise<this> {
    if (this.mount) await unmount(this.mount);

    let route = this.routes.find(
      (route) =>
        (typeof route.path === "string" && route.path == this.currentPath) ||
        (route.path instanceof RegExp && route.path.test(this.currentPath))
    );

    this.mount = mount(
      route?.component ? route.component : this.fallbackComponent,
      { target: this.target }
    );

    return this;
  }

  public async unmount(): Promise<this> {
    if (this.mount) await unmount(this.mount);
    return this;
  }

  /** onclick handler for anchor elements to prevent page reload */
  public anchorOnclickHandler(): (ev: Event) => void {
    return (ev) => {
      let target = ev.target as HTMLElement | null;
      let iterations = 0;

      while (target) {
        iterations++;
        if (target instanceof HTMLAnchorElement) break;
        target = target.parentElement;
      }
      if (!target) {
        console.error(
          `Failed to find anchor element when handling redirect (failed after ${iterations} iterations)`
        );
        return;
      }

      ev.preventDefault();

      const url = new URL(target.href);
      this.goto(url);
    };
  }
}
