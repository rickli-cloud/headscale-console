# Configuration

> Configuration is **completely optional**

On startup the console tries to load `./config.json`. For the docker image you can mount `/config.json` (or somewhere else defined with the configfile flag).

## Options

| Key                   | Type     | Default  | Description                                                                                       |
| --------------------- | -------- | -------- | ------------------------------------------------------------------------------------------------- |
| logLevel              | string   | "INFO    | OFF \| ERROR \| WARN \| INFO \| DEBUG \| TRACE                                                    |
| controlUrl            | string   | Base URL | The Headscale control url. E.g. `https://headscale.example.com`                                   |
| selfserviceHostname   | string   |          | Used to identify the self-service node. If undefined all self-service features will be hidden     |
| policyserviceHostname | string   |          | Used to identify the policy-service node. If undefined all policy-service features will be hidden |
| tags                  | string[] |          | Tags applied to clients. (Only apply when using a authkey)                                        |
