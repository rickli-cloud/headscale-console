// Test-only entry point. It mounts production components with a synthetic IPN;
// no WASM client, identity provider or real SSH server is contacted.
import { mount } from "svelte";
import { ModeWatcher } from "mode-watcher";
import { netMap } from "../src/lib/store/ipn";
import { appConfig } from "../src/lib/store/config";
import { loadUserSettings } from "../src/lib/store/settings";
import { AppRouter } from "../src/lib/utils/router";
import routes from "../src/routes";
import "../src/app.css";

const params = new URLSearchParams(location.search);
const calls: {
  host: string;
  username: string;
  input: string[];
  closed: boolean;
  connected: boolean;
  ended: boolean;
}[] = [];
const loginName = params.get("login") ?? "alex@example.com";
const profile = {
  Config: {
    UserProfile: { ID: 1, LoginName: loginName, DisplayName: "Alex Example" },
  },
};
Object.assign(window, {
  ipnProfiles: { currentProfile: profile },
  sshCalls: calls,
  ipn: {
    ssh(host: string, username: string, options: Parameters<IPN["ssh"]>[2]) {
      const call = {
        host,
        username,
        input: [] as string[],
        closed: false,
        connected: false,
        ended: false,
      };
      calls.push(call);
      const timer = setTimeout(() => {
        if (params.has("fail")) {
          options.writeErrorFn("SSH Connection Error: permission denied\r\n");
          call.ended = true;
          call.closed = true;
          options.onDone();
        } else {
          options.setReadFn((data) => {
            call.input.push(data);
            if (call.input.join("").endsWith("exit\r")) {
              call.ended = true;
              call.closed = true;
              options.onDone();
            }
          });
          call.connected = true;
          options.onConnected();
          options.writeFn(`Connected.\r\n${username}@${host}:~$ `);
        }
      }, 20);
      return {
        close() {
          clearTimeout(timer);
          call.closed = true;
          options.onDone();
        },
        resize() {},
      };
    },
  },
});
appConfig.set({
  controlUrl: "https://headscale.example.com",
  logLevel: "OFF",
  tags: [],
  defaults: {},
});
loadUserSettings(
  params.has("defaults")
    ? { "ssh-default-username-enabled": "true", "ssh-auto-connect": "true" }
    : {},
);
netMap.set(
  { domain: "example.tailnet", users: {}, peers: [] } as unknown as IPNNetMap,
);
mount(ModeWatcher, { target: document.body });
const router = new AppRouter({
  target: document.getElementById("app")!,
  routes,
  fallbackComponent: routes[0].component,
});
Object.assign(window, { appRouter: router });
router.resolve();
