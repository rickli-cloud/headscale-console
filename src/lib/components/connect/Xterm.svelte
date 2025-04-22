<script lang="ts">
  import { FitAddon } from "@xterm/addon-fit";
  import { WebLinksAddon } from "@xterm/addon-web-links";
  import {
    Terminal,
    type IDisposable,
    type ITerminalOptions,
  } from "@xterm/xterm";
  import { onMount } from "svelte";

  interface Props {
    hostname: string;
    terminalOptions?: ITerminalOptions;
  }

  const { hostname, terminalOptions }: Props = $props();

  let username = $state("");
  let session: IPNSSHSession | undefined = $state();
  let loginListener: IDisposable | undefined = $state();

  let el: HTMLDivElement;

  const resizeObserver = new ResizeObserver(() => fitAddon.fit());

  const terminal = new Terminal({
    cursorBlink: true,
    allowProposedApi: true,
    ...terminalOptions,
  });

  const fitAddon = new FitAddon();
  terminal.loadAddon(fitAddon);

  const webLinksAddon = new WebLinksAddon((event, uri) =>
    event.view?.open(uri, "_blank", "noopener")
  );
  terminal.loadAddon(webLinksAddon);

  onMount(() => {
    window.addEventListener("beforeunload", beforeUnloadHandler);

    terminal.open(el);
    resizeObserver.observe(el);
    fitAddon.fit();
    terminal.focus();

    attachLoginListener();

    return () => {
      window.removeEventListener("beforeunload", beforeUnloadHandler);

      session?.close();
      loginListener?.dispose();
      terminal.dispose();
      fitAddon.dispose();
      webLinksAddon.dispose();
      resizeObserver.disconnect();
    };
  });

  function attachLoginListener() {
    terminal.write(`${hostname} login: `);

    loginListener = terminal.onKey(async (ev) => {
      switch (ev.key) {
        case "\u0016": // CTRL + v
          navigator.clipboard
            .readText()
            .then((clipboard) => {
              terminal.write(clipboard);
              username = username + clipboard;
            })
            .catch((err) => {
              console.warn("Failed to read text from clipboard:", err);
            });
          break;
        case "\u000c": // CTRL + l
          username = "";
          await new Promise((r) => terminal.writeln("\r", () => r(null)));
          terminal.clear();
          terminal.write(`${hostname} login: `);
          break;
        case "\u007f": // Backspace
          if (!username.length) break;
          username = username.slice(0, username.length - 1);
          await new Promise((r) => terminal.writeln("\r", () => r(null)));
          terminal.clear();
          terminal.write(`${hostname} login: ${username}`);
          break;
        case "\r":
          loginListener?.dispose();
          terminal.writeln("\r");
          login();
          break;
        default:
          if (ev.key.length !== 1) break;
          username = username + ev.key;
          terminal.write(ev.key);
          break;
      }
    });

    function login() {
      let onDataHook: ((data: string) => void) | undefined;
      terminal.onData((e) => onDataHook?.(e));

      session = window.ipn.ssh(hostname, username.trim(), {
        writeFn: (input) => {
          terminal.write(input);
        },
        writeErrorFn: (err) => {
          // callbacks.onError?.(err)
          terminal.write(err);
          console.error(err);
        },
        setReadFn(hook) {
          onDataHook = hook;
        },
        rows: terminal.rows,
        cols: terminal.cols,
        onConnectionProgress: () => {
          // console.debug("Connection progress");
        },
        onConnected: () => {
          // console.debug("Connected!");
        },
        onDone: () => {
          onDataHook = undefined;
          session?.close();
          session = undefined;
          username = "";

          terminal.write("Press any key to continue... ");

          const cleanupListener = terminal.onKey((ev) => {
            cleanupListener.dispose();
            terminal.clear();
            terminal.reset();
            attachLoginListener();
          });
        },
        timeoutSeconds: 30,
      });
    }
  }

  const beforeUnloadHandler = (event: Event) => {
    if (!session) return;
    event.preventDefault(); // Recommended
    event.returnValue = true; // Included for legacy support, e.g. Chrome/Edge < 119
  };
</script>

<div bind:this={el} class="h-full w-full"></div>
