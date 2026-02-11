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
