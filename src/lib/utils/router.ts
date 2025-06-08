import { mount, unmount, type Component } from "svelte";

export type AppRoute = { path: string | RegExp; component: Component };

export class AppRouter {
  protected mount?: object;

  public readonly routes: AppRoute[] = [];
  public fallbackComponent: Component;
  public target: HTMLElement;

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
    // window.addEventListener("load", () => this.resolve());
  }

  public get currentPath(): string {
    return window.location.hash.replace(/^#/, "").replace(/^\/?/, "/");
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
}
