<script lang="ts">
  import { FitAddon } from "@xterm/addon-fit";
  import { WebLinksAddon } from "@xterm/addon-web-links";
  import { Terminal, type ITerminalOptions } from "@xterm/xterm";
  import { onMount } from "svelte";
  import { get } from "svelte/store";

  import { userSettings } from "$lib/store/settings";
  import { defaultSSHUsername, sshPreferences, validSSHHostname, validSSHUsername } from "$lib/utils/ssh";

  interface Props {
    hostname?: string;
    terminalOptions?: ITerminalOptions;
  }

  const { hostname: initialHostname = "", terminalOptions }: Props = $props();
  let hostname = $state(validSSHHostname(initialHostname.trim()) ? initialHostname.trim() : "");
  let username = $state("");
  let status = $state<"Ready" | "Connecting" | "Connected" | "Disconnected" | "Failed">("Ready");
  let session: IPNSSHSession | undefined;
  let el: HTMLDivElement;
  let prompt: "host" | "username" | undefined;
  let onDataHook: ((data: string) => void) | undefined;
  let generation = 0;
  let disposed = false;
  let awaitingContinue = false;

  const terminal = new Terminal({ cursorBlink: true, allowProposedApi: true, ...terminalOptions });
  const fitAddon = new FitAddon();
  terminal.loadAddon(fitAddon);
  const webLinksAddon = new WebLinksAddon((event, uri) => event.view?.open(uri, "_blank", "noopener"));
  terminal.loadAddon(webLinksAddon);
  const resizeObserver = new ResizeObserver(() => {
    fitAddon.fit();
    session?.resize(terminal.rows, terminal.cols);
  });

  onMount(() => {
    window.addEventListener("beforeunload", beforeUnloadHandler);
    terminal.open(el);
    resizeObserver.observe(el);
    fitAddon.fit();
    terminal.focus();

    const inputListener = terminal.onData((data) => {
      if (awaitingContinue) {
        awaitingContinue = false;
        generation++;
        username = "";
        terminal.clear();
        terminal.reset();
        showPrompt("username");
        return;
      }
      if (!prompt) onDataHook?.(data);
      else handlePromptInput(data);
    });
    const pasteListener = terminal.onKey(({ key }) => {
      if (key !== "\u0016" || !prompt) return;
      const activeGeneration = generation;
      const activePrompt = prompt;
      navigator.clipboard.readText().then((text) => {
        if (!disposed && generation === activeGeneration && prompt === activePrompt) {
          // Pasted newlines must not submit a prompt or reach a remote shell.
          handlePromptInput(text.replace(/[\r\n]/g, ""));
        }
      }).catch(() => {
        if (!disposed) terminal.writeln("\r\nClipboard unavailable. Use your browser's paste command.");
      });
    });

    if (hostname) prepareUsername();
    else showPrompt("host");

    return () => {
      disposed = true;
      generation++;
      window.removeEventListener("beforeunload", beforeUnloadHandler);
      inputListener.dispose();
      pasteListener.dispose();
      onDataHook = undefined;
      session?.close();
      resizeObserver.disconnect();
      terminal.dispose();
    };
  });

  function prepareUsername() {
    // Snapshot preferences for this connection; never use the destination owner.
    const preferences = sshPreferences(get(userSettings));
    username = defaultSSHUsername(preferences,
      window.ipnProfiles?.currentProfile?.Config.UserProfile.LoginName) ?? "";
    if (username && preferences.autoConnect) login();
    else showPrompt("username");
  }

  function showPrompt(kind: "host" | "username") {
    prompt = kind;
    status = "Ready";
    terminal.write(kind === "host" ? `host: ${hostname}` : `${hostname} login: ${username}`);
    terminal.focus();
  }

  function redrawPrompt() {
    terminal.write("\r\u001b[2K");
    terminal.write(prompt === "host" ? `host: ${hostname}` : `${hostname} login: ${username}`);
  }

  function handlePromptInput(data: string) {
    // Ignore terminal navigation sequences; only printable prompt input is accepted.
    data = data.replace(/\u001b\[[0-9;?]*[ -/]*[@-~]/g, "");
    if (data.length > 1) data = data.replace(/[\r\n]/g, "");
    for (const character of data) {
      if (!prompt) break; // Never forward the remainder of pasted input to SSH.
      if (character === "\r" || character === "\n") {
        if (prompt === "host") {
          hostname = hostname.trim();
          if (!validSSHHostname(hostname)) {
            terminal.writeln("\r\nEnter a hostname or IP address without a username or port.");
            redrawPrompt();
            continue;
          }
          terminal.writeln("");
          prompt = undefined;
          prepareUsername();
        } else {
          username = username.trim();
          if (!validSSHUsername(username)) {
            terminal.writeln("\r\nEnter a valid Linux username (up to 64 characters).");
            redrawPrompt();
            continue;
          }
          terminal.writeln("");
          login();
        }
        // A multi-line paste can confirm at most one prompt.
        break;
      }
      if (character === "\u007f" || character === "\b") {
        if (prompt === "host") hostname = hostname.slice(0, -1);
        else username = username.slice(0, -1);
        redrawPrompt();
      } else if (character === "\u000c" || character === "\u0015") {
        if (prompt === "host") hostname = "";
        else username = "";
        redrawPrompt();
      } else if (character >= " " && character !== "\u007f") {
        if (prompt === "host" && hostname.length < 253) hostname += character;
        else if (prompt === "username" && username.length < 64) username += character;
        redrawPrompt();
      }
    }
  }

  function login() {
    if (disposed || status === "Connecting" || status === "Connected" || !validSSHHostname(hostname) || !validSSHUsername(username)) return;
    prompt = undefined;
    status = "Connecting";
    const activeGeneration = ++generation;
    const active = () => !disposed && activeGeneration === generation;
    terminal.writeln(`Connecting to ${hostname} as ${username}…`);
    const nextSession = window.ipn.ssh(hostname, username, {
      writeFn: (input) => { if (active()) terminal.write(input); },
      writeErrorFn: (error) => {
        if (!active()) return;
        status = "Failed";
        terminal.write(error);
      },
      setReadFn: (hook) => { if (active()) onDataHook = hook; },
      rows: terminal.rows,
      cols: terminal.cols,
      onConnectionProgress: () => {},
      onConnected: () => {
        // A pending WASM dial can outlive unmount; close it once it opens.
        if (!active()) { nextSession.close(); return; }
        status = "Connected";
      },
      onDone: () => {
        if (!active()) return;
        onDataHook = undefined;
        session = undefined;
        if (status !== "Failed") status = "Disconnected";
        awaitingContinue = true;
        terminal.write("\r\nPress any key to continue... ");
      },
      timeoutSeconds: 30,
    });
    if (active() && (status === "Connecting" || status === "Connected")) session = nextSession;
    terminal.focus();
  }

  const beforeUnloadHandler = (event: Event) => {
    if (status !== "Connecting" && status !== "Connected") return;
    event.preventDefault();
    event.returnValue = true;
  };
</script>

<div bind:this={el} class="h-full w-full" role="region" aria-label="SSH terminal"></div>
