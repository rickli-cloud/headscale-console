import { get } from "svelte/store";

import { appConfig } from "$lib/store/config";
import { ServerError } from "$lib/utils/error";

export class Policyservice {
  public static async getPolicy(): Promise<{
    policy: string;
    updatedAt: string;
  }> {
    const host = get(appConfig).policyserviceHostname;

    if (!host) {
      throw new Error("Policy-Service hostname undefined");
    }

    const res = await window.ipn.fetch({
      url: `http://${host}/api/v1/policy`,
      method: "GET",
    });

    if (res.status !== 200) {
      throw new ServerError("Status " + res.status, {
        cause: res.text(),
      });
    }

    return JSON.parse(await res.text());
  }

  public static async setPolicy(policy: string): Promise<void> {
    const host = get(appConfig).policyserviceHostname;

    if (!host) {
      throw new Error("Policy-Service hostname undefined");
    }

    const res = await window.ipn.fetch({
      url: `http://${host}/api/v1/policy`,
      method: "POST",
      body: policy,
    });

    if (res.status !== 200) {
      throw new ServerError("Status " + res.status, {
        cause: res.text(),
      });
    }

    return;
  }
}
