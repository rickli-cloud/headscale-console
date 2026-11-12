# Configuration

> [!NOTE]
> Configuration is **completely optional**

On startup the app tries to load `./config.json`.

**Docker**: Mount `/config.json`

**Static**: Add `config.json` to root

## Full Config Example

```json
{
  "logLevel": "INFO",
  "controlUrl": "https://headscale.example.com",
  "tags": ["tag:js"]
}
```

## Options

### logLevel

> Console log level. Useful for debugging.

**Type**: `String` (enum)

**Default**: `INFO`

**Options**: `OFF`, `ERROR`, `WARN`, `INFO`, `DEBUG`, `TRACE`

---

### controlUrl

> The control server url. E.g. `https://headscale.example.com`

**Type**: `String`

**Default**: Current page

---

### tags

> Tags applied to clients (Usually only apply when using a authkey).

**Type**: `String[]`

**Default**: `[]`

---

### defaults

Optional initial browser preferences. Settings → SSH offers a **Username** selector
and a **Connect automatically** switch. **Ask every time** is the default username
mode; selecting it also turns automatic connection off. Choosing Headscale, root
or Custom enables a default username, with the resolved Headscale account shown
in the selector and the custom field displayed only when needed. Local browser
choices override deployment defaults, including explicit `"false"`. Preferences
apply to new connections, not active sessions. Existing preference keys remain
compatible; the separate username-enabled switch is no longer displayed.

```json
{
  "defaults": {
    "ssh-default-username-enabled": "true",
    "ssh-username-source": "headscale",
    "ssh-custom-username": "",
    "ssh-auto-connect": "false"
  }
}
```

All preference values are strings. Username sources:

- `headscale`: the current browser profile's login name, before the first `@`.
  For example, `alex@example.com` and `alex@` both suggest `alex`. This is an
  explicit convenience mapping, not a guarantee that the account exists. The
  destination owner and display name are never used.
- `root`: request the literal `root` account. The destination's existing SSH
  policy must allow it; choosing it does not grant additional permissions.
- `custom`: use the trimmed `ssh-custom-username` value.

Common Linux usernames up to 64 characters are accepted: an ASCII letter or `_`
first, then letters, digits, `_`, `.`, `-`, and an optional final `$`. Missing or
invalid defaults require manual input; the client never tries another account.

A supplied host skips the host prompt. With automatic connection disabled, a
valid default is prefilled for confirmation with Enter. With automatic connection
enabled, a known host and valid default start one SSH connection. A missing host
is requested first. Failed/ended sessions offer **Reconnect** and **Change user**;
they never reconnect automatically. **Disconnect** is available after connection.
The destination and connection status remain visible above the terminal.

Preferences are browser-local and contain no passwords or private keys. Existing
Tailscale SSH authentication and authorization remain in effect. VNC/RDP are
unaffected.
