import type {
  GroupPanelPartInitParameters,
  IContentRenderer,
} from "dockview-core";
import {
  Terminal,
  type IDisposable,
  type ITerminalOptions,
} from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";

interface XtermConstructorParameters extends ITerminalOptions {}

export class XtermPanel implements IContentRenderer {
  protected readonly _element: HTMLElement;
  protected readonly terminal: Terminal;
  protected readonly fitAddon: FitAddon;
  protected readonly webLinksAddon: WebLinksAddon;
  protected readonly resizeObserver = new ResizeObserver(() =>
    this.fitAddon.fit()
  );

  protected loginListener: IDisposable | undefined;
  protected sshSession: IPNSSHSession | undefined;
  protected _hostname: string | undefined;
  protected _username: string = "";

  get element(): HTMLElement {
    return this._element;
  }
  get username(): string {
    return this._username;
  }
  get hostname(): string | undefined {
    return this._hostname;
  }

  constructor(terminalOptions?: XtermConstructorParameters) {
    this._element = document.createElement("div");
    this.element.classList.add("h-full", "w-full");

    this.terminal = new Terminal({
      cursorBlink: true,
      allowProposedApi: true,
      ...terminalOptions,
    });

    this.fitAddon = new FitAddon();
    this.terminal.loadAddon(this.fitAddon);

    this.webLinksAddon = new WebLinksAddon((event, uri) =>
      event.view?.open(uri, "_blank", "noopener")
    );
    this.terminal.loadAddon(this.webLinksAddon);

    this.terminal.onKey((ev) => {
      switch (ev.key) {
        case "\u0002": // CTRL + b
          // Simulate key press on document
          document.dispatchEvent(
            new KeyboardEvent(ev.domEvent.type, {
              bubbles: true,
              ctrlKey: ev.domEvent.ctrlKey,
              key: ev.domEvent.key,
            })
          );
          break;
      }
    });
  }

  init({ params }: GroupPanelPartInitParameters): void {
    if (!("hostname" in params)) {
      throw new Error("Xterm panel params do not contain hostname");
    }

    this._hostname = params.hostname;

    this.terminal.open(this._element);
    this.resizeObserver.observe(this._element);
    this.fitAddon.fit();
    this.terminal.focus();

    this.attachLoginListener();
  }

  private attachLoginListener() {
    this.terminal.write(`${this._hostname} login: `);

    this.loginListener = this.terminal.onKey(async (ev) => {
      switch (ev.key) {
        case "\u0016": // CTRL + v
          navigator.clipboard
            .readText()
            .then((clipboard) => {
              this.terminal.write(clipboard);
              this._username = this._username + clipboard;
            })
            .catch((err) => {
              console.warn("Failed to read text from clipboard:", err);
            });
          break;
        case "\u000c": // CTRL + l
          this._username = "";
          await new Promise((r) => this.terminal.writeln("\r", () => r(null)));
          this.terminal.clear();
          this.terminal.write(`${this._hostname} login: `);
          break;
        case "\u007f": // Backspace
          if (!this._username.length) break;
          this._username = this._username.slice(0, this._username.length - 1);
          await new Promise((r) => this.terminal.writeln("\r", () => r(null)));
          this.terminal.clear();
          this.terminal.write(`${this._hostname} login: ${this._username}`);
          break;
        case "\r":
          this.loginListener?.dispose();
          this.terminal.writeln("\r");
          this.login();
          break;
        default:
          if (ev.key.length !== 1) break;
          this._username = this._username + ev.key;
          this.terminal.write(ev.key);
          break;
      }
    });
  }

  private login() {
    let onDataHook: ((data: string) => void) | undefined;
    this.terminal.onData((e) => onDataHook?.(e));

    if (!this._hostname) {
      throw new Error(
        "Called login method on Xterm panel class without hostname!"
      );
    }

    this.sshSession = window.ipn.ssh(this._hostname, this._username.trim(), {
      writeFn: (input) => {
        this.terminal.write(input);
      },
      writeErrorFn: (err) => {
        // callbacks.onError?.(err)
        this.terminal.write(err);
        console.error(err);
      },
      setReadFn(hook) {
        onDataHook = hook;
      },
      rows: this.terminal.rows,
      cols: this.terminal.cols,
      onConnectionProgress: () => {
        // console.debug("Connection progress");
      },
      onConnected: () => {
        // console.debug("Connected!");
      },
      onDone: () => {
        onDataHook = undefined;
        this.sshSession?.close();
        this.sshSession = undefined;
        this._username = "";

        const cleanupListener = this.terminal.onKey((ev) => {
          cleanupListener.dispose();
          this.terminal.clear();
          this.terminal.reset();
          this.attachLoginListener();
        });
      },
      timeoutSeconds: 30,
    });
  }
}
